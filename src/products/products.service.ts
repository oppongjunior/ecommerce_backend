import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateArgs } from '../commons/entities/paginate.args';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createProductInput: CreateProductInput) {
    return this.prismaService.product.create({ data: createProductInput });
  }

  async findAll(paginateFilter: PaginateArgs) {
    const { first, after } = paginateFilter;
    const take = first;
    const skip = after ? 1 : 0;
    const cursor = after ? { id: after } : undefined;

    const products = await this.prismaService.product.findMany({
      take,
      skip,
      cursor,
    });
    const totalCount = await this.prismaService.product.count();
    const lastProduct = products[totalCount - 1];
    return {
      edges: products.map((item) => ({ cursor: item.id, node: item })),
      pageInfo: {
        hasNextPage: lastProduct ? totalCount > products.length : false,
        hasPreviousPage: !!after,
        pageSize: take,
      },
    };
  }

  findOne(id: string) {
    return this.prismaService.product.findUnique({ where: { id } });
  }

  async update(id: string, updateProductInput: UpdateProductInput) {
    await this.checkProduct(id);
    return this.prismaService.product.update({ where: { id }, data: updateProductInput });
  }

  remove(id: string) {
    return this.prismaService.product.delete({ where: { id } });
  }

  private async checkProduct(id: string) {
    const product = await this.prismaService.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
  }
}
