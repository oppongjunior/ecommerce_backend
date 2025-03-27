import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wishlist } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Retrieves the user's wishlist or creates one if it doesn’t exist.
   * @param userId - The ID of the user.
   * @returns The user's wishlist with product details.
   */
  async getOrCreateWishlist(userId: string) {
    const wishlist = await this.fetchWishlist(userId);
    return wishlist || (await this.createWishlist(userId));
  }

  /**
   * Adds a product to the user's wishlist.
   * @param userId - The ID of the user.
   * @param productId - The ID of the product.
   * @returns The updated wishlist.
   */
  async addToWishlist(userId: string, productId: string) {
    await this.validateProductExists(productId);
    const wishlist = await this.getOrCreateWishlist(userId);
    await this.ensureProductNotInWishlist(wishlist, productId);
    return this.connectProductToWishlist(wishlist.id, productId);
  }

  /**
   * Removes a product from the user's wishlist.
   * @param userId - The ID of the user.
   * @param productId - The ID of the product.
   * @returns The updated wishlist.
   */
  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    await this.ensureProductInWishlist(wishlist, productId);
    return this.disconnectProductFromWishlist(wishlist.id, productId);
  }

  /**
   * Clears all products from the user's wishlist.
   * @param userId - The ID of the user.
   * @returns The updated wishlist.
   */
  async clearWishlist(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return this.resetWishlistProducts(wishlist.id);
  }

  private async fetchWishlist(userId: string) {
    return this.prismaService.wishlist.findUnique({
      where: { userId },
      include: { products: { select: { id: true, name: true } } },
    });
  }

  private async createWishlist(userId: string): Promise<Wishlist & { products: { id: string; name: string }[] }> {
    return this.prismaService.wishlist.create({
      data: { userId },
      include: { products: { select: { id: true, name: true } } },
    });
  }

  private async validateProductExists(productId: string): Promise<void> {
    const product = await this.prismaService.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found`);
    }
  }

  private async ensureProductNotInWishlist(
    wishlist: Wishlist & { products: { id: string }[] },
    productId: string,
  ): Promise<void> {
    if (this.isProductInWishlist(wishlist, productId)) {
      throw new BadRequestException(`Product "${productId}" is already in your wishlist`);
    }
  }

  private async ensureProductInWishlist(wishlist: Wishlist & { products: { id: string }[] }, productId: string) {
    if (!this.isProductInWishlist(wishlist, productId)) {
      throw new NotFoundException(`Product "${productId}" not found in your wishlist`);
    }
  }

  private isProductInWishlist(wishlist: Wishlist & { products: { id: string }[] }, productId: string): boolean {
    return wishlist.products.some((product) => product.id === productId);
  }

  private async connectProductToWishlist(wishlistId: string, productId: string) {
    return this.prismaService.wishlist.update({
      where: { id: wishlistId },
      data: { products: { connect: { id: productId } } },
      include: { products: { select: { id: true, name: true } } },
    });
  }

  private async disconnectProductFromWishlist(wishlistId: string, productId: string) {
    return this.prismaService.wishlist.update({
      where: { id: wishlistId },
      data: { products: { disconnect: { id: productId } } },
      include: { products: { select: { id: true, name: true } } },
    });
  }

  private async resetWishlistProducts(wishlistId: string) {
    return this.prismaService.wishlist.update({
      where: { id: wishlistId },
      data: { products: { set: [] } },
      include: { products: { select: { id: true, name: true } } },
    });
  }
}
