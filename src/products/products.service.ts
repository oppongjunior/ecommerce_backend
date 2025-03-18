import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterArgs } from './dto/product-filter.args';
import { Prisma, Product } from '@prisma/client';
import { PaginateArgs } from '../commons/entities/paginate.args';

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
    await this.validateCategoryAndSubcategory(createProductInput.categoryId, createProductInput.subcategoryId);
    await this.validateSkuUniqueness(createProductInput.sku);

    return this.prismaService.product.create({
      data: {
        ...createProductInput,
        isActive: createProductInput.isActive ?? false,
      },
      include: { category: true, subcategory: true },
    });
  }

  /**
   * Retrieves a paginated list of products with filtering.
   * @param paginate
   * @param filter - Pagination and filter arguments (first, after, categoryId, etc.).
   * @returns A paginated response with edges and pageInfo.
   */
  async findAll(
    paginate: PaginateArgs,
    filter: ProductFilterArgs = {},
  ): Promise<{
    edges: { cursor: string; node: Product }[];
    pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; pageSize: number };
  }> {
    const paginationOptions = this.buildPaginationOptions(paginate);
    const whereClause = this.buildWhereClause(filter);

    const products = await this.fetchProducts(paginationOptions, whereClause);
    const totalCount = await this.countProducts(whereClause);
    return this.formatPaginatedResponse(products, totalCount, paginationOptions);
  }

  /**
   * Retrieves a single product by its ID.
   *
   * @param id - The unique identifier of the product to retrieve.
   * @returns The product with its associated category and subcategory, or null if not found.
   */
  async findOne(id: string): Promise<Product | null> {
    return this.prismaService.product.findUnique({ where: { id }, include: { category: true, subcategory: true } });
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
    await this.checkProductExists(id);
    await this.validateUpdateInput(id, updateProductInput);

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
    await this.checkProductExists(id);
    await this.checkProductDependencies(id);

    return this.prismaService.product.delete({ where: { id } });
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
    await this.checkProductExists(id);
    return this.prismaService.product.update({ where: { id }, data: { isActive: false } });
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
    await this.checkProductExists(id);
    return this.prismaService.product.update({ where: { id }, data: { isActive: true } });
  }

  // --- Private Helper Methods ---
  private buildPaginationOptions({ first, after }: PaginateArgs) {
    const pageSize = Math.min(first, 100);
    const hasCursor = !!after;
    return { take: pageSize, skip: hasCursor ? 1 : 0, cursor: hasCursor ? { id: after } : undefined };
  }

  private async validateCategoryAndSubcategory(categoryId: string, subcategoryId?: string): Promise<void> {
    const category = await this.prismaService.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException(`Category ID "${categoryId}" not found`);

    if (subcategoryId) {
      const subcategory = await this.prismaService.subCategory.findUnique({ where: { id: subcategoryId } });
      if (!subcategory) throw new NotFoundException(`Subcategory ID "${subcategoryId}" not found`);
      if (subcategory.categoryId !== categoryId) {
        throw new ConflictException(`Subcategory ID "${subcategoryId}" does not belong to category ID "${categoryId}"`);
      }
    }
  }

  private async validateSkuUniqueness(sku?: string): Promise<void> {
    if (sku) {
      const existing = await this.prismaService.product.findFirst({
        where: { sku: { equals: sku, mode: 'insensitive' } },
      });
      if (existing) throw new ConflictException(`SKU "${sku}" is already in use`);
    }
  }

  private async validateUpdateInput(id: string, updateProductInput: UpdateProductInput): Promise<void> {
    const { sku, categoryId, subcategoryId } = updateProductInput;

    if (sku) {
      const existing = await this.prismaService.product.findFirst({
        where: { sku: { equals: sku, mode: 'insensitive' }, NOT: { id } },
      });
      if (existing) throw new ConflictException(`SKU "${sku}" is already in use by another product`);
    }

    if (categoryId || subcategoryId) {
      const currentProduct = await this.findOne(id);
      const finalCategoryId = categoryId || currentProduct?.categoryId;
      await this.validateCategoryAndSubcategory(finalCategoryId, subcategoryId);
    }
  }

  private async checkProductExists(id: string): Promise<void> {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Product not found');
  }

  private async checkProductDependencies(id: string): Promise<void> {
    const cartItemCount = await this.prismaService.cartItem.count({ where: { productId: id } });
    const orderItemCount = await this.prismaService.orderItem.count({ where: { productId: id } });
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
          { tags: { some: { name: { contains: search, mode: 'insensitive' } } } },
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
  ): Promise<Product[]> {
    return this.prismaService.product.findMany({
      take,
      skip,
      cursor,
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true, subcategory: true },
    });
  }

  private async countProducts(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prismaService.product.count({ where });
  }

  private formatPaginatedResponse(
    products: Product[],
    totalCount: number,
    { skip, take }: { take: number; skip: number },
  ): {
    edges: { cursor: string; node: Product }[];
    pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; pageSize: number };
  } {
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
}
