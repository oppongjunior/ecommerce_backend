import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TagService } from './tag.service';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Tag } from './entities/tag.entity';

@Resolver(() => Tag)
export class TagResolver {
  constructor(private readonly tagService: TagService) {}

  @Query(() => Tag, {
    name: 'tag',
    description: 'Retrieves a specific tag by ID',
  })
  async getTag(
    @Args('tagId', { type: () => String }) tagId: string,
  ): Promise<Tag> {
    return this.tagService.getTag(tagId);
  }

  @Roles(Role.ADMIN)
  @Query(() => [Tag], { name: 'tags', description: 'Retrieves all tags' })
  async getAllTags(): Promise<Tag[]> {
    return this.tagService.getAllTags();
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Tag, { name: 'createTag', description: 'Creates a new tag' })
  async createTag(
    @Args('name', { type: () => String }) name: string,
  ): Promise<Tag> {
    return this.tagService.createTag(name);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Tag, {
    name: 'updateTag',
    description: 'Updates an existing tag',
  })
  async updateTag(
    @Args('tagId', { type: () => String }) tagId: string,
    @Args('name', { type: () => String }) name: string,
  ): Promise<Tag> {
    return this.tagService.updateTag(tagId, name);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Tag, { name: 'deleteTag', description: 'Deletes a tag' })
  async deleteTag(
    @Args('tagId', { type: () => String }) tagId: string,
  ): Promise<Tag> {
    return this.tagService.deleteTag(tagId);
  }
}
