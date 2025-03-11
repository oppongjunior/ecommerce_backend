import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new category using the provided input data.
   *
   * @param createCategoryInput - The input data for creating a new category.
   * @returns The created category object.
   */
  create(createCategoryInput: CreateCategoryInput) {
    console.log(createCategoryInput.name);
    return this.prismaService.category.create({ data: createCategoryInput });
  }

  /**
   * Retrieves all categories from the database.
   *
   * @returns An array of category objects.
   */
  findAll() {
    return this.prismaService.category.findMany();
  }

  /**
   * Retrieves a category by its unique identifier.
   *
   * @param id - The unique identifier of the category to retrieve.
   * @returns The category object if found, otherwise null.
   */
  findOne(id: string) {
    return this.prismaService.category.findUnique({ where: { id } });
  }

  /**
   * Updates an existing category with the provided input data.
   *
   * @param id - The unique identifier of the category to update.
   * @param updateCategoryInput - The input data for updating the category.
   * @returns The updated category object.
   * @throws NotFoundException if the category does not exist.
   */
  async update(id: string, updateCategoryInput: UpdateCategoryInput) {
    await this.checkCategory(id);
    return this.prismaService.category.update({
      where: { id },
      data: { name: updateCategoryInput.name, description: updateCategoryInput.description },
    });
  }

  /**
   * Removes a category by its unique identifier.
   *
   * @param id - The unique identifier of the category to remove.
   * @returns The deleted category object.
   * @throws NotFoundException if the category does not exist.
   */
  async remove(id: string) {
    await this.checkCategory(id);
    return this.prismaService.category.delete({ where: { id } });
  }

  private async checkCategory(id: string) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException('Category not found');
  }
}
