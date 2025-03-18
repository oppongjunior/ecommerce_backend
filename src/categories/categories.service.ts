import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new category using the provided input data.
   * @param createCategoryInput - The input data for creating a new category.
   * @returns A promise resolving to the created category.
   * @throws {ConflictException} If a category with the same name (case-insensitive) already exists.
   */
  async create(createCategoryInput: CreateCategoryInput): Promise<Category> {
    const { name } = createCategoryInput;
    const existing = await this.findCategoryByName(name);
    if (existing) throw new ConflictException(`A category with the name "${name}" already exists`);
    return this.prismaService.category.create({ data: createCategoryInput });
  }

  /**
   * Retrieves all categories from the database, sorted alphabetically by name.
   * @returns A promise resolving to an array of categories.
   */
  async findAll(): Promise<Category[]> {
    return this.prismaService.category.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Retrieves a category by its unique identifier.
   * @param id - The unique identifier of the category.
   * @returns A promise resolving to the category or null if not found.
   */
  async findOne(id: string): Promise<Category | null> {
    return this.prismaService.category.findUnique({ where: { id } });
  }

  /**
   * Updates an existing category with the provided input data.
   * @param id - The unique identifier of the category to update.
   * @param updateCategoryInput - The input data for updating the category.
   * @returns A promise resolving to the updated category.
   * @throws {NotFoundException} If the category does not exist.
   * @throws {ConflictException} If the new name conflicts with an existing category.
   */
  async update(id: string, updateCategoryInput: UpdateCategoryInput): Promise<Category> {
    await this.checkCategory(id);
    if (updateCategoryInput.name) {
      const existing = await this.findCategoryByName(updateCategoryInput.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(`A category with the name "${updateCategoryInput.name}" already exists`);
      }
    }
    return this.prismaService.category.update({
      where: { id },
      data: { name: updateCategoryInput.name, description: updateCategoryInput.description },
    });
  }

  /**
   * Removes a category by its unique identifier.
   * @param id - The unique identifier of the category to remove.
   * @returns A promise resolving to the removed category.
   * @throws {NotFoundException} If the category does not exist.
   * @throws {ConflictException} If the category has associated products.
   */
  async remove(id: string): Promise<Category> {
    await this.checkCategory(id);
    const productCount = await this.prismaService.product.count({ where: { categoryId: id } });
    if (productCount > 0) throw new ConflictException('Cannot delete category with associated products');
    return this.prismaService.category.delete({ where: { id } });
  }

  /**
   * Finds a category by its name (case-insensitive).
   * @param name - The name of the category to find.
   * @returns A promise resolving to the category or null if not found.
   */
  async findCategoryByName(name: string): Promise<Category | null> {
    return this.prismaService.category.findFirst({ where: { name: { mode: 'insensitive', equals: name } } });
  }

  /**
   * Checks if a category exists by its ID.
   * @param id - The unique identifier of the category.
   * @throws {NotFoundException} If the category does not exist.
   */
  private async checkCategory(id: string): Promise<void> {
    const category = await this.findOne(id);
    if (!category) throw new NotFoundException('Category not found');
  }
}
