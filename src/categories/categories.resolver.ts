import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { Role } from '@prisma/client';
import { Roles } from '../iam/authentication/decorators/roles.decorator';

@Roles(Role.ADMIN)
@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Mutation(() => Category, { description: 'Creates a new category (admin only)' })
  createCategory(@Args('input', { type: () => CreateCategoryInput }) input: CreateCategoryInput) {
    return this.categoriesService.create(input);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Query(() => [Category], {
    name: 'categories',
    description: 'Retrieves a list of all categories, sorted alphabetically by name',
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Query(() => Category, {
    name: 'category',
    nullable: true,
    description: 'Retrieves a category by its unique ID, or null if not found',
  })
  findOne(@Args('id', { type: () => String, description: 'The ID of the category' }) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Mutation(() => Category, { description: 'Updates an existing category (admin only)' })
  updateCategory(
    @Args('id', { type: () => String, description: 'The ID of the category to update' }) id: string,
    @Args('input', { type: () => UpdateCategoryInput }) input: UpdateCategoryInput,
  ) {
    return this.categoriesService.update(id, input);
  }

  @Mutation(() => Category, { description: 'Deletes a category by ID (admin only)' })
  removeCategory(@Args('id', { type: () => String, description: 'The ID of the category to delete' }) id: string) {
    return this.categoriesService.remove(id);
  }
}
