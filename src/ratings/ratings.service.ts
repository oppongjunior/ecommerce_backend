import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatingInput } from './dto/create-rating.input';
import { UpdateRatingInput } from './dto/update-rating.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createRatingInput: CreateRatingInput) {
    return this.prismaService.rating.create({ data: createRatingInput });
  }

  findAll() {
    return this.prismaService.rating.findMany();
  }

  findOne(id: string) {
    return this.prismaService.rating.findUnique({ where: { id } });
  }

  async update(id: string, updateRatingInput: UpdateRatingInput) {
    await this.checkRating(id);
    return this.prismaService.rating.update({ where: { id }, data: updateRatingInput });
  }

  async remove(id: string) {
    await this.checkRating(id);
    return this.prismaService.rating.delete({ where: { id } });
  }

  private async checkRating(id: string) {
    const rating = await this.prismaService.rating.findUnique({ where: { id } });
    if (!rating) throw new NotFoundException('Rating not found');
  }
}
