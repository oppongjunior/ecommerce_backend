import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VariantService } from './variant.service';
import { Variant } from './entities/variant.entity';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateVariantInput } from './dto/create-variant.input';
import { UpdateVariantInput } from './dto/update-variant.input';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Resolver(() => Variant)
export class VariantResolver {
  constructor(private readonly variantService: VariantService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Query(() => Variant, {
    name: 'variant',
    description: 'Retrieves a specific variant by ID',
  })
  async getVariant(@Args('variantId', { type: () => String }) variantId: string) {
    return this.variantService.getVariant(variantId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Query(() => [Variant], {
    name: 'productVariants',
    description: 'Retrieves all variants for a product',
  })
  async getProductVariants(@Args('productId', { type: () => String }) productId: string) {
    return this.variantService.getProductVariants(productId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Query(() => [Variant], {
    name: 'variants',
    description: 'Retrieves all variants (admin only)',
  })
  async getAllVariants() {
    return this.variantService.getAllVariants();
  }

  @Mutation(() => Variant, {
    name: 'createVariant',
    description: 'Creates a new variant for a product',
  })
  async createVariant(@Args('input') input: CreateVariantInput) {
    return this.variantService.createVariant(input);
  }

  @Mutation(() => Variant, {
    name: 'updateVariant',
    description: 'Updates an existing variant',
  })
  async updateVariant(@Args('input') input: UpdateVariantInput) {
    return this.variantService.updateVariant(input.id, input);
  }

  @Mutation(() => Variant, {
    name: 'deleteVariant',
    description: 'Deletes a variant',
  })
  async deleteVariant(@Args('variantId', { type: () => String }) variantId: string) {
    return this.variantService.deleteVariant(variantId);
  }
}
