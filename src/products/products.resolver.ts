import { Args, Float, Info, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterArgs } from './dto/product-filter.args';
import { ProductConnection } from './entities/product-connection.entity';
import { Prisma, Role } from '@prisma/client';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { DiscountService } from '../discount/discount.service';
import { Discount } from '../discount/entities/discount.entity';
import { PaginationArgs } from '../commons/dto/paginate.args';
import { GraphQLResolveInfo } from 'graphql/type';
import { extractRequestedFieldsFromQuery } from '../commons/useful-functions';
import { Auth } from '../iam/authentication/decorators/auth.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly discountService: DiscountService,
  ) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product)
  createProduct(
    @Args('createProductInput', { type: () => CreateProductInput })
    createProductInput: CreateProductInput,
  ) {
    return this.productsService.create(createProductInput);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product)
  updateProduct(
    @Args('productId', { type: () => String }) productId: string,
    @Args('updateProductInput', { type: () => UpdateProductInput })
    updateProductInput: UpdateProductInput,
  ) {
    return this.productsService.update(productId, updateProductInput);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product)
  permanentlyDeleteProduct(@Args('productId', { type: () => String }) productId: string) {
    return this.productsService.remove(productId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product)
  archiveProduct(@Args('productId', { type: () => String }) productId: string) {
    return this.productsService.archiveProduct(productId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product)
  restoreProduct(@Args('productId', { type: () => String }) productId: string) {
    return this.productsService.restoreProduct(productId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product, { name: 'addTagToProduct' })
  async addTagToProduct(
    @Args('productId', { type: () => String }) productId: string,
    @Args('tagId', { type: () => String }) tagId: string,
  ) {
    return this.productsService.addTagToProduct(productId, tagId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Product, { name: 'removeTagFromProduct' })
  async removeTagFromProduct(
    @Args('productId', { type: () => String }) productId: string,
    @Args('tagId', { type: () => String }) tagId: string,
  ) {
    return this.productsService.removeTagFromProduct(productId, tagId);
  }

  @Auth(AuthType.None)
  @Query(() => ProductConnection, { name: 'products' })
  findAll(
    @Args('paginationArgs', { type: () => PaginationArgs, nullable: true })
    paginationArgs: PaginationArgs = { first: 10 },
    @Args('filterArgs', { type: () => ProductFilterArgs, nullable: true })
    filterArgs: ProductFilterArgs = {},
    @Info() requestInfo?: GraphQLResolveInfo,
  ) {
    const requestedFields = extractRequestedFieldsFromQuery(requestInfo, {
      excludedFields: ['edges', 'cursor', 'node', 'discountedPrice', 'appliedDiscount'],
      level: 3,
    });
    return this.productsService.findAll(paginationArgs, filterArgs, requestedFields);
  }

  @Auth(AuthType.None)
  @Query(() => Product, { name: 'product', nullable: true })
  findOne(@Args('productId', { type: () => String }) productId: string, @Info() requestInfo?: GraphQLResolveInfo) {
    const requestedFields = extractRequestedFieldsFromQuery(requestInfo, {
      excludedFields: ['discountedPrice'],
    });
    return this.productsService.findOne(productId, requestedFields);
  }

  @ResolveField(() => Float, { nullable: true })
  async discountedPrice(@Parent() product: Product) {
    const { discountedPrice } = await this.discountService.getDiscountedPriceForProduct(product.id);
    return (discountedPrice as unknown as Prisma.Decimal) !== product.price ? discountedPrice : null;
  }

  @ResolveField(() => Discount, { nullable: true })
  async appliedDiscount(@Parent() product: Product) {
    const { discountId } = await this.discountService.getDiscountedPriceForProduct(product.id);
    return discountId ? this.discountService.findOneDiscount(discountId) : null;
  }
}
