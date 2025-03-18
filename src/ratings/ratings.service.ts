import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatingInput } from './dto/create-rating.input';
import { UpdateRatingInput } from './dto/update-rating.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createRatingInput: CreateRatingInput) {
    return this.prismaService.review.create({ data: createRatingInput });
  }

  findAll() {
    return this.prismaService.review.findMany();
  }

  findOne(id: string) {
    return this.prismaService.review.findUnique({ where: { id } });
  }

  async update(id: string, updateRatingInput: UpdateRatingInput) {
    await this.checkRating(id);
    return this.prismaService.review.update({ where: { id }, data: updateRatingInput });
  }

  async remove(id: string) {
    await this.checkRating(id);
    return this.prismaService.review.delete({ where: { id } });
  }

  private async checkRating(id: string) {
    const rating = await this.prismaService.review.findUnique({ where: { id } });
    if (!rating) throw new NotFoundException('Rating not found');
  }
}
