import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryInput } from './dto/create-sub-category.input';
import { UpdateSubCategoryInput } from './dto/update-sub-category.input';

import { Role } from '@prisma/client';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { SubCategory } from './entities/sub-category.entity';

@Roles(Role.ADMIN)
@Resolver(() => SubCategory)
export class SubCategoriesResolver {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Mutation(() => SubCategory, { description: 'Creates a new subcategory (admin only)' })
  createSubCategory(
    @Args('input', { type: () => CreateSubCategoryInput, description: 'Input data for the new subcategory' })
    input: CreateSubCategoryInput,
  ) {
    return this.subCategoriesService.create(input);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Query(() => [SubCategory], {
    name: 'subCategories',
    description: 'Retrieves a list of all subcategories, sorted alphabetically by name',
  })
  findAll() {
    return this.subCategoriesService.findAll();
  }

  @Query(() => SubCategory, {
    name: 'subCategory',
    nullable: true,
    description: 'Retrieves a subcategory by its unique ID, or null if not found',
  })
  findOne(@Args('id', { type: () => String, description: 'The ID of the subcategory' }) id: string) {
    return this.subCategoriesService.findOne(id);
  }

  @Mutation(() => SubCategory, { description: 'Updates an existing subcategory (admin only)' })
  @Roles(Role.ADMIN)
  updateSubCategory(
    @Args('id', { type: () => String, description: 'The ID of the subcategory to update' }) id: string,
    @Args('input', { type: () => UpdateSubCategoryInput, description: 'Updated data for the subcategory' })
    input: UpdateSubCategoryInput,
  ) {
    return this.subCategoriesService.update(id, input);
  }

  @Mutation(() => SubCategory, { description: 'Deletes a subcategory by ID (admin only)' })
  @Roles(Role.ADMIN)
  removeSubCategory(
    @Args('id', { type: () => String, description: 'The ID of the subcategory to delete' }) id: string,
  ) {
    return this.subCategoriesService.remove(id);
  }
}
