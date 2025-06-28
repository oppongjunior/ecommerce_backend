import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterArgs } from './dto/product-filter.args';
import { Prisma, Product } from '@prisma/client';
import { PaginationArgs } from '../commons/dto/paginate.args';
import { ProductConnection } from './entities/product-connection.entity';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new product in the database.
   * Validates the category, subcategory, and SKU for uniqueness before creation.
   *
   * @param createProductInput - The input data for creating a new product.
   * @returns The created product with its associated category and subcategory.
   * @throws NotFoundException if the category or subcategory does not exist.
   * @throws ConflictException if the SKU is already in use.
   */
  async create(createProductInput: CreateProductInput): Promise<Product> {
    await this.validateProductInput(createProductInput);
    return this.prismaService.product.create({
      data: createProductInput,
      include: { category: true, subcategory: true },
    });
  }

  /**
   * Updates an existing product in the database.
   * Validates the product's existence and the update input before proceeding.
   *
   * @param id - The unique identifier of the product to update.
   * @param updateProductInput - The input data for updating the product.
   * @returns The updated product with its associated category and subcategory.
   * @throws NotFoundException if the product does not exist.
   * @throws ConflictException if the SKU is already in use by another product.
   */
  async update(id: string, updateProductInput: UpdateProductInput): Promise<Product> {
    await this.ensureProductExist(id);
    await this.validateProductInput({ ...updateProductInput, id });
    return this.prismaService.product.update({
      where: { id },
      data: updateProductInput,
      include: { category: true, subcategory: true },
    });
  }

  /**
   * Removes a product from the database by its ID.
   * Validates the product's existence and checks for dependencies before deletion.
   *
   * @param id - The unique identifier of the product to remove.
   * @returns The deleted product with its associated category and subcategory.
   * @throws NotFoundException if the product does not exist.
   * @throws ConflictException if the product is referenced in active carts or orders.
   */
  async remove(id: string): Promise<Product> {
    await this.ensureProductExist(id);
    await this.checkProductDependencies(id);
    return this.prismaService.product.delete({ where: { id } });
  }

  async addTagToProduct(productId: string, tagId: string): Promise<Product> {
    return this.updateProductTag(productId, tagId, 'connect');
  }

  async removeTagFromProduct(productId: string, tagId: string): Promise<Product> {
    return this.updateProductTag(productId, tagId, 'disconnect');
  }

  /**
   * Retrieves a paginated list of products with filtering.
   * @param paginate
   * @param filter - Pagination and filter arguments (first, after, categoryId, etc.).
   * @param requestedData
   * @returns A paginated response with edges and pageInfo.
   */
  async findAll(
    paginate: PaginationArgs,
    filter: ProductFilterArgs = {},
    requestedData?: Prisma.ProductSelect,
  ): Promise<ProductConnection> {
    const paginationOptions = this.buildPaginationOptions(paginate);
    const whereClause = this.buildWhereClause(filter);

    const products = await this.fetchProducts(paginationOptions, whereClause, requestedData);
    const totalCount = await this.countProducts(whereClause);
    return this.formatPaginatedResponse(products, totalCount, paginationOptions);
  }

  /**
   * Retrieves a single product by its ID.
   *
   * @param id - The unique identifier of the product to retrieve.
   * @param requestedFields
   * @returns The product with its associated category and subcategory, or null if not found.
   */
  async findOne(id: string, requestedFields: Prisma.ProductSelect = {}): Promise<Product | null> {
    const queryOptions: Prisma.ProductFindUniqueArgs = { where: { id } };
    if (Object.keys(requestedFields).length) queryOptions.select = { ...requestedFields, id: true };
    return this.prismaService.product.findUnique(queryOptions);
  }

  /**
   * Archives a product by setting its isActive status to false.
   * Validates the product's existence before proceeding.
   *
   * @param id - The unique identifier of the product to archive.
   * @returns The updated product with its isActive status set to false.
   * @throws NotFoundException if the product does not exist.
   */
  async archiveProduct(id: string): Promise<Product> {
    await this.ensureProductExist(id);
    return this.prismaService.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Restores a previously archived product by setting its isActive status to true.
   * Validates the product's existence before proceeding.
   *
   * @param id - The unique identifier of the product to restore.
   * @returns The updated product with its isActive status set to true.
   * @throws NotFoundException if the product does not exist.
   */
  async restoreProduct(id: string): Promise<Product> {
    await this.ensureProductExist(id);
    return this.prismaService.product.update({
      where: { id },
      data: { isActive: true },
    });
  }

  private buildPaginationOptions({ first, after }: PaginationArgs) {
    const pageSize = Math.min(first, 100);
    const hasCursor = !!after;
    return {
      take: pageSize,
      skip: hasCursor ? 1 : 0,
      cursor: hasCursor ? { id: after } : undefined,
    };
  }

  private async validateProductInput(input: CreateProductInput | (UpdateProductInput & { id: string })) {
    await this.validateCategoryAndSubcategory(input.categoryId, input.subcategoryId);
    await this.validateSkuUniqueness(input);
  }

  private async validateCategoryAndSubcategory(categoryId: string, subcategoryId?: string): Promise<void> {
    if (categoryId) {
      const category = await this.prismaService.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new NotFoundException(`Category ID "${categoryId}" not found`);
    }

    if (subcategoryId) {
      const subcategory = await this.prismaService.subCategory.findUnique({
        where: { id: subcategoryId },
      });
      if (!subcategory) throw new NotFoundException(`Subcategory ID "${subcategoryId}" not found`);
      if (subcategory.categoryId !== categoryId) {
        throw new ConflictException(`Subcategory ID "${subcategoryId}" does not belong to category ID "${categoryId}"`);
      }
    }
  }

  private async validateSkuUniqueness(input: CreateProductInput | UpdateProductInput): Promise<void> {
    const { sku } = input;
    if (sku) {
      const existing = await this.prismaService.product.findFirst({
        where: { sku: { equals: sku, mode: 'insensitive' } },
      });
      if ('id' in input && existing && existing.id != input.id) {
        throw new ConflictException(`SKU "${sku}" is already in use by another product`);
      }

      if (!('id' in input) && existing) {
        throw new ConflictException(`SKU "${sku}" is already in use`);
      }
    }
  }

  private async ensureProductExist(id: string): Promise<void> {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Product not found');
  }

  private async checkProductDependencies(id: string): Promise<void> {
    const cartItemCount = await this.prismaService.cartItem.count({
      where: { productId: id },
    });
    const orderItemCount = await this.prismaService.orderItem.count({
      where: { productId: id },
    });
    if (cartItemCount > 0 || orderItemCount > 0) {
      throw new ConflictException('Cannot delete product referenced in active carts or orders');
    }
  }

  private buildWhereClause(filter: ProductFilterArgs): Prisma.ProductWhereInput {
    const { categoryId, subcategoryId, isActive, search, createdAfter, priceMin, priceMax, brand } = filter;
    return {
      ...(categoryId && { categoryId }),
      ...(subcategoryId && { subcategoryId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          {
            tags: { some: { name: { contains: search, mode: 'insensitive' } } },
          },
        ],
      }),
      ...(createdAfter && { createdAt: { gte: new Date(createdAfter) } }),
      ...(priceMin !== undefined && { price: { gte: priceMin } }),
      ...(priceMax !== undefined && { price: { lte: priceMax } }),
      ...(brand && { brand }),
    };
  }

  private async fetchProducts(
    { take, skip, cursor }: { take: number; skip: number; cursor?: { id: string } },
    where: Prisma.ProductWhereInput,
    requestedField: Prisma.ProductSelect = {},
  ): Promise<Product[]> {
    const queryOptions: Prisma.ProductFindManyArgs = {
      take,
      skip,
      cursor,
      where,
      orderBy: { createdAt: 'desc' },
    };
    if (Object.keys(requestedField).length) queryOptions.select = { ...requestedField, id: true };
    return this.prismaService.product.findMany(queryOptions);
  }

  private async countProducts(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prismaService.product.count({ where });
  }

  private formatPaginatedResponse(
    products: Product[],
    totalCount: number,
    { skip, take }: { take: number; skip: number },
  ): ProductConnection {
    const lastProduct = products[products.length - 1];
    const itemsFetched = skip + products.length;
    return {
      edges: products.map((product) => ({
        cursor: product.id,
        node: product,
      })),
      pageInfo: {
        pageSize: take,
        hasPreviousPage: skip > 0,
        hasNextPage: !!lastProduct && totalCount > itemsFetched,
      },
    };
  }

  private async ensureTagExists(tagId: string): Promise<void> {
    const tag = await this.prismaService.tag.findUnique({
      where: { id: tagId },
    });
    if (!tag) throw new NotFoundException(`Tag "${tagId}" not found`);
  }

  private async updateProductTag(
    productId: string,
    tagId: string,
    operation: 'connect' | 'disconnect',
  ): Promise<Product> {
    await this.ensureProductExist(productId);
    await this.ensureTagExists(tagId);
    return this.prismaService.product.update({
      where: { id: productId },
      data: { tags: { [operation]: { id: tagId } } },
      include: { tags: true },
    });
  }
}
