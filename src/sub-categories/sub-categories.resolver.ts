import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SubCategoriesService } from './sub-categories.service';
import { SubCategory } from './entities/sub-category.entity';
import { CreateSubCategoryInput } from './dto/create-sub-category.input';
import { UpdateSubCategoryInput } from './dto/update-sub-category.input';

@Resolver(() => SubCategory)
export class SubCategoriesResolver {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Mutation(() => SubCategory)
  createSubCategory(@Args('createSubCategoryInput') createSubCategoryInput: CreateSubCategoryInput) {
    return this.subCategoriesService.create(createSubCategoryInput);
  }

  @Query(() => [SubCategory], { name: 'subCategories' })
  findAll() {
    return this.subCategoriesService.findAll();
  }

  @Query(() => SubCategory, { name: 'subCategory' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.subCategoriesService.findOne(id);
  }

  @Mutation(() => SubCategory)
  updateSubCategory(@Args('updateSubCategoryInput') updateSubCategoryInput: UpdateSubCategoryInput) {
    return this.subCategoriesService.update(updateSubCategoryInput.id, updateSubCategoryInput);
  }

  @Mutation(() => SubCategory)
  removeSubCategory(@Args('id', { type: () => String }) id: string) {
    return this.subCategoriesService.remove(id);
  }
}
