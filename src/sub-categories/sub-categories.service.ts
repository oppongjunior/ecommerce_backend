import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubCategoryInput } from './dto/create-sub-category.input';
import { UpdateSubCategoryInput } from './dto/update-sub-category.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubCategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new subcategory using the provided input data.
   *
   * @param createSubCategoryInput - The input data for creating a new subcategory.
   * @returns The created subcategory object.
   */
  create(createSubCategoryInput: CreateSubCategoryInput) {
    return this.prismaService.subcategory.create({ data: createSubCategoryInput });
  }

  /**
   * Retrieves all subcategories from the database.
   *
   * @returns An array of subcategory objects.
   */
  findAll() {
    return this.prismaService.subcategory.findMany();
  }

  /**
   * Retrieves a subcategory by its unique identifier.
   *
   * @param id - The unique identifier of the subcategory to retrieve.
   * @returns The subcategory object if found, otherwise null.
   */
  findOne(id: string) {
    return this.prismaService.subcategory.findUnique({ where: { id } });
  }

  /**
   * Updates an existing subcategory with the provided input data.
   *
   * @param id - The unique identifier of the subcategory to update.
   * @param updateSubCategoryInput - The input data for updating the subcategory.
   * @returns The updated subcategory object.
   * @throws NotFoundException if the subcategory with the given id does not exist.
   */
  async update(id: string, updateSubCategoryInput: UpdateSubCategoryInput) {
    await this.checkSubCategory(id);
    return this.prismaService.subcategory.update({ where: { id }, data: updateSubCategoryInput });
  }

  /**
   * Removes a subcategory by its unique identifier.
   *
   * @param id - The unique identifier of the subcategory to remove.
   * @returns The deleted subcategory object.
   * @throws NotFoundException if the subcategory with the given id does not exist.
   */
  async remove(id: string) {
    await this.checkSubCategory(id);
    return this.prismaService.subcategory.delete({ where: { id } });
  }

  private async checkSubCategory(id: string) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException('Category not found');
  }
}
