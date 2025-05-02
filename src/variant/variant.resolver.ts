import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VariantService } from './variant.service';
import { Variant } from './entities/variant.entity';
import { Auth } from '../iam/authentication/decorators/auth.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateVariantInput } from './dto/create-variant.input';
import { UpdateVariantInput } from './dto/update-variant.input';

@Resolver(() => Variant)
export class VariantResolver {
  constructor(private readonly variantService: VariantService) {}

  @Query(() => Variant, {
    name: 'variant',
    description: 'Retrieves a specific variant by ID',
  })
  async getVariant(
    @Args('variantId', { type: () => String }) variantId: string,
  ) {
    return this.variantService.getVariant(variantId);
  }

  @Query(() => [Variant], {
    name: 'productVariants',
    description: 'Retrieves all variants for a product',
  })
  async getProductVariants(
    @Args('productId', { type: () => String }) productId: string,
  ) {
    return this.variantService.getProductVariants(productId);
  }

  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @Query(() => [Variant], {
    name: 'variants',
    description: 'Retrieves all variants (admin only)',
  })
  async getAllVariants() {
    return this.variantService.getAllVariants();
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Variant, {
    name: 'createVariant',
    description: 'Creates a new variant for a product',
  })
  async createVariant(@Args('input') input: CreateVariantInput) {
    return this.variantService.createVariant(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Variant, {
    name: 'updateVariant',
    description: 'Updates an existing variant',
  })
  async updateVariant(@Args('input') input: UpdateVariantInput) {
    return this.variantService.updateVariant(input.id, input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Variant, {
    name: 'deleteVariant',
    description: 'Deletes a variant',
  })
  async deleteVariant(
    @Args('variantId', { type: () => String }) variantId: string,
  ) {
    return this.variantService.deleteVariant(variantId);
  }
}
