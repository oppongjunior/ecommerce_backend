import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { PaginateArgs } from '../commons/entities/paginate.args';
import { ProductFilterArgs } from './dto/product-filter.args';
import { ProductConnection } from './entities/product-connection.entity';
import { Role } from '@prisma/client';
import { Roles } from '../iam/authentication/decorators/roles.decorator';

@Roles(Role.ADMIN)
@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Mutation(() => Product, { description: 'Creates a new product (admin only)' })
  createProduct(
    @Args('input', { type: () => CreateProductInput, description: 'Input data for the new product' })
    input: CreateProductInput,
  ) {
    return this.productsService.create(input);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Query(() => ProductConnection, {
    name: 'products',
    description: 'Retrieves a paginated list of products with optional filtering (e.g., by category, price range)',
  })
  findAll(
    @Args('paginate', { type: () => PaginateArgs, nullable: true, description: 'Pagination options (first, after)' })
    paginate: PaginateArgs = { first: 10 },
    @Args('filter', {
      type: () => ProductFilterArgs,
      nullable: true,
      description: 'Filter options (categoryId, search, etc.)',
    })
    filter: ProductFilterArgs = {},
  ) {
    return this.productsService.findAll(paginate, filter);
  }

  @Query(() => Product, {
    name: 'product',
    nullable: true,
    description: 'Retrieves a single product by its ID, or null if not found',
  })
  findOne(@Args('id', { type: () => String, description: 'The unique ID of the product' }) id: string) {
    return this.productsService.findOne(id);
  }

  @Mutation(() => Product, { description: 'Updates an existing product (admin only)' })
  updateProduct(
    @Args('id', { type: () => String, description: 'The ID of the product to update' }) id: string,
    @Args('input', { type: () => UpdateProductInput, description: 'Updated data for the product' })
    input: UpdateProductInput,
  ) {
    return this.productsService.update(id, input);
  }

  @Mutation(() => Product, { description: 'Deletes a product by ID (admin only)' })
  removeProduct(@Args('id', { type: () => String, description: 'The ID of the product to delete' }) id: string) {
    return this.productsService.remove(id);
  }

  @Mutation(() => Product, { description: 'Archives a product by setting isActive to false (admin only)' })
  archiveProduct(@Args('id', { type: () => String, description: 'The ID of the product to archive' }) id: string) {
    return this.productsService.archiveProduct(id);
  }

  @Mutation(() => Product, { description: 'Restores an archived product by setting isActive to true (admin only)' })
  restoreProduct(@Args('id', { type: () => String, description: 'The ID of the product to restore' }) id: string) {
    return this.productsService.restoreProduct(id);
  }
}
