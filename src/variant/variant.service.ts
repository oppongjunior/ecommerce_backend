import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Variant } from '@prisma/client';
import { CreateVariantInput } from './dto/create-variant.input';
import { UpdateVariantInput } from './dto/update-variant.input';

@Injectable()
export class VariantService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new variant for a product.
   * @param data - The variant data to create.
   * @returns The created variant.
   */
  async createVariant(data: CreateVariantInput) {
    await this.ensureProductExists(data.productId);
    return this.saveVariant(data);
  }

  /**
   * Retrieves a specific variant by ID.
   * @param variantId - The ID of the variant.
   * @returns The variant with its product.
   */
  async getVariant(variantId: string): Promise<Variant & { product: { id: string; name: string } }> {
    return this.retrieveVariant(variantId);
  }

  /**
   * Retrieves all variants for a product.
   * @param productId - The ID of the product.
   * @returns List of variants with their products.
   */
  async getProductVariants(productId: string): Promise<(Variant & { product: { id: string; name: string } })[]> {
    await this.ensureProductExists(productId);
    return this.fetchProductVariants(productId);
  }

  /**
   * Retrieves all variants (admin only).
   * @returns List of all variants.
   */
  async getAllVariants(): Promise<Variant[]> {
    return this.fetchAllVariants();
  }

  /**
   * Updates an existing variant.
   * @param variantId - The ID of the variant.
   * @param data - The variant data to update.
   * @returns The updated variant.
   */
  async updateVariant(variantId: string, data: UpdateVariantInput): Promise<Variant> {
    await this.retrieveVariant(variantId);
    return this.modifyVariant(variantId, data);
  }

  /**
   * Deletes a variant.
   * @param variantId - The ID of the variant.
   * @returns The deleted variant.
   */
  async deleteVariant(variantId: string): Promise<Variant> {
    await this.retrieveVariant(variantId);
    return this.removeVariant(variantId);
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found`);
    }
  }

  private async saveVariant(data: CreateVariantInput): Promise<Variant> {
    return this.prismaService.variant.create({
      data,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  private async retrieveVariant(variantId: string): Promise<Variant & { product: { id: string; name: string } }> {
    const variant = await this.prismaService.variant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, name: true } } },
    });
    if (!variant) {
      throw new NotFoundException(`Variant "${variantId}" not found`);
    }
    return variant;
  }

  private async fetchProductVariants(
    productId: string,
  ): Promise<(Variant & { product: { id: string; name: string } })[]> {
    return this.prismaService.variant.findMany({
      where: { productId },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    });
  }

  private async fetchAllVariants(): Promise<Variant[]> {
    return this.prismaService.variant.findMany({
      orderBy: { id: 'asc' },
    });
  }

  private async modifyVariant(variantId: string, data: UpdateVariantInput): Promise<Variant> {
    return this.prismaService.variant.update({
      where: { id: variantId },
      data,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  private async removeVariant(variantId: string): Promise<Variant> {
    return this.prismaService.variant.delete({
      where: { id: variantId },
    });
  }
}
