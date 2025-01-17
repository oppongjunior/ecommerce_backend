import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createCategoryInput: CreateCategoryInput) {
    return this.prismaService.category.create({ data: createCategoryInput });
  }

  findAll() {
    return this.prismaService.category.findMany();
  }

  findOne(id: string) {
    return this.prismaService.category.findUnique({ where: { id } });
  }

  async update(id: string, updateCategoryInput: UpdateCategoryInput) {
    await this.checkCategory(id);
    return this.prismaService.category.update({
      where: { id },
      data: { name: updateCategoryInput.name, description: updateCategoryInput.description },
    });
  }

  async remove(id: string) {
    await this.checkCategory(id);
    return this.prismaService.category.delete({ where: { id } });
  }

  private async checkCategory(id: string) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException('Category not found');
  }
}
