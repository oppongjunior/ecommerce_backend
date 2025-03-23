import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tag } from '@prisma/client';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new tag.
   * @param name - The name of the tag.
   * @returns The created tag.
   */
  async createTag(name: string): Promise<Tag> {
    await this.ensureTagNameUnique(name);
    return this.saveTag(name);
  }

  /**
   * Retrieves a specific tag by ID.
   * @param tagId - The ID of the tag.
   * @returns The tag.
   */
  async getTag(tagId: string): Promise<Tag> {
    return this.retrieveTag(tagId);
  }

  /**
   * Retrieves all tags.
   * @returns List of all tags.
   */
  async getAllTags(): Promise<Tag[]> {
    return this.fetchAllTags();
  }

  /**
   * Updates an existing tag.
   * @param tagId - The ID of the tag.
   * @param name - The new name for the tag.
   * @returns The updated tag.
   */
  async updateTag(tagId: string, name: string): Promise<Tag> {
    await this.retrieveTag(tagId);
    await this.ensureTagNameUnique(name, tagId);
    return this.modifyTag(tagId, name);
  }

  /**
   * Deletes a tag.
   * @param tagId - The ID of the tag.
   * @returns The deleted tag.
   */
  async deleteTag(tagId: string): Promise<Tag> {
    await this.retrieveTag(tagId);
    return this.removeTag(tagId);
  }

  private async ensureTagNameUnique(name: string, excludeTagId?: string): Promise<void> {
    const existingTag = await this.prismaService.tag.findUnique({ where: { name } });
    if (existingTag && existingTag.id !== excludeTagId) {
      throw new BadRequestException(`Tag name "${name}" is already in use`);
    }
  }

  private async saveTag(name: string): Promise<Tag> {
    return this.prismaService.tag.create({
      data: { name },
    });
  }

  private async retrieveTag(tagId: string): Promise<Tag> {
    const tag = await this.prismaService.tag.findUnique({
      where: { id: tagId },
    });
    if (!tag) {
      throw new NotFoundException(`Tag "${tagId}" not found`);
    }
    return tag;
  }

  private async fetchAllTags(): Promise<Tag[]> {
    return this.prismaService.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  private async modifyTag(tagId: string, name: string): Promise<Tag> {
    return this.prismaService.tag.update({
      where: { id: tagId },
      data: { name },
    });
  }

  private async removeTag(tagId: string): Promise<Tag> {
    return this.prismaService.tag.delete({
      where: { id: tagId },
    });
  }
}
