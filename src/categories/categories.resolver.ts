import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { Role } from '@prisma/client';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';
import { Auth } from '../iam/authentication/decorators/auth.decorator';
import { extractRequestedFieldsFromQuery } from '../commons/useful-functions';
import { GraphQLResolveInfo } from 'graphql/type';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Category, {
    description: 'Creates a new category (admin only)',
  })
  createCategory(
    @Args('input', { type: () => CreateCategoryInput })
    input: CreateCategoryInput,
  ) {
    return this.categoriesService.create(input);
  }

  @Auth(AuthType.None)
  @Query(() => [Category], {
    name: 'categories',
    description: 'Retrieves a list of all categories, sorted alphabetically by name',
  })
  findAll(@Info() requestInfo?: GraphQLResolveInfo) {
    const requestedFields = extractRequestedFieldsFromQuery(requestInfo, {
      excludedFields: [],
      level: 1,
    });
    return this.categoriesService.findAll(requestedFields);
  }

  @Roles(Role.SUPER_ADMIN, Role.USER, Role.ADMIN)
  @Query(() => Category, {
    name: 'category',
    nullable: true,
    description: 'Retrieves a category by its unique ID, or null if not found',
  })
  findOne(
    @Args('id', { type: () => String, description: 'The ID of the category' })
    id: string,
  ) {
    return this.categoriesService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Category, {
    description: 'Updates an existing category (admin only)',
  })
  updateCategory(
    @Args('id', {
      type: () => String,
      description: 'The ID of the category to update',
    })
    id: string,
    @Args('input', { type: () => UpdateCategoryInput })
    input: UpdateCategoryInput,
  ) {
    return this.categoriesService.update(id, input);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Mutation(() => Category, {
    description: 'Deletes a category by ID (admin only)',
  })
  removeCategory(
    @Args('id', {
      type: () => String,
      description: 'The ID of the category to delete',
    })
    id: string,
  ) {
    return this.categoriesService.remove(id);
  }
}
