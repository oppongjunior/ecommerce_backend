import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BrandService } from './brand.service';
import { CreateBrandInput } from './dto/create-brand.input';
import { UpdateBrandInput } from './dto/update-brand.input';
import { Brand } from './entities/brand.entity';
import { GraphQLResolveInfo } from 'graphql/type';
import { extractRequestedFieldsFromQuery } from '../commons/useful-functions';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => Brand)
export class BrandResolver {
  constructor(private readonly brandService: BrandService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Brand)
  async createBrand(@Args('input') input: CreateBrandInput) {
    return this.brandService.createBrand(input);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Brand)
  async updateBrand(@Args('id') id: string, @Args('input') input: UpdateBrandInput) {
    return this.brandService.updateBrand(id, input);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Brand)
  async deleteBrand(@Args('id') id: string) {
    return this.brandService.deleteBrand(id);
  }

  @Query(() => Brand, { nullable: true })
  async brand(@Args('id') id: string) {
    return this.brandService.getBrandById(id);
  }

  @Query(() => [Brand], { nullable: 'itemsAndList' })
  async brands(@Info() requestInfo?: GraphQLResolveInfo) {
    const requestedFields = extractRequestedFieldsFromQuery(requestInfo, {
      excludedFields: [],
      level: 1,
    });
    return this.brandService.getAllBrands(requestedFields);
  }
}
