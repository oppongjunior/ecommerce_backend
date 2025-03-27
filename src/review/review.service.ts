import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Review } from '@prisma/client';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a review for a product by a user.
   * @param userId - The ID of the user.
   * @param input - The review input data.
   * @returns The created review.
   */
  async createReview(userId: string, input: CreateReviewInput): Promise<Review> {
    await this.validateProductExists(input.productId);
    await this.ensureUserHasNotReviewed(userId, input.productId);
    return this.saveReview(userId, input);
  }

  /**
   * Retrieves a specific review by ID.
   * @param reviewId - The ID of the review.
   * @returns The review with user and product details.
   */
  async getReview(reviewId: string) {
    return this.fetchReview(reviewId);
  }

  /**
   * Retrieves all reviews for a product.
   * @param productId - The ID of the product.
   * @returns List of reviews with user details.
   */
  async getProductReviews(productId: string): Promise<(Review & { user: { id: string; email: string } })[]> {
    await this.validateProductExists(productId);
    return this.fetchProductReviews(productId);
  }

  /**
   * Retrieves all reviews by a user.
   * @param userId - The ID of the user.
   * @returns List of reviews with product details.
   */
  async getUserReviews(userId: string): Promise<(Review & { product: { id: string; name: string } })[]> {
    return this.fetchUserReviews(userId);
  }

  /**
   * Updates a review by the user who created it.
   * @param userId - The ID of the user.
   * @param input - The updated review input data.
   * @returns The updated review.
   */
  async updateReview(userId: string, input: UpdateReviewInput): Promise<Review> {
    const review = await this.fetchReview(input.id);
    await this.ensureUserOwnsReview(userId, review);
    return this.modifyReview(input);
  }

  /**
   * Deletes a review by the user who created it.
   * @param userId - The ID of the user.
   * @param reviewId - The ID of the review.
   * @returns The deleted review.
   */
  async deleteReview(userId: string, reviewId: string): Promise<Review> {
    const review = await this.fetchReview(reviewId);
    await this.ensureUserOwnsReview(userId, review);
    return this.removeReview(reviewId);
  }

  private async validateProductExists(productId: string): Promise<void> {
    const product = await this.prismaService.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found`);
    }
  }

  private async ensureUserHasNotReviewed(userId: string, productId: string): Promise<void> {
    const existingReview = await this.prismaService.review.findFirst({
      where: { userId, productId },
    });
    if (existingReview) {
      throw new BadRequestException(`You have already reviewed product "${productId}"`);
    }
  }

  private async ensureUserOwnsReview(userId: string, review: Review): Promise<void> {
    if (review.userId !== userId) {
      throw new BadRequestException(`You can only modify your own reviews`);
    }
  }

  private async saveReview(userId: string, input: CreateReviewInput): Promise<Review> {
    const { productId, score, comment } = input;
    return this.prismaService.review.create({
      data: { userId, productId, score, comment },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }

  private async fetchReview(reviewId: string) {
    const review = await this.prismaService.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });
    if (!review) throw new NotFoundException(`Review "${reviewId}" not found`);
    return review;
  }

  private async fetchProductReviews(productId: string): Promise<(Review & { user: { id: string; email: string } })[]> {
    return this.prismaService.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { id: 'asc' },
    });
  }

  private async fetchUserReviews(userId: string): Promise<(Review & { product: { id: string; name: string } })[]> {
    return this.prismaService.review.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    });
  }

  private async modifyReview(input: UpdateReviewInput): Promise<Review> {
    const { id, score, comment } = input;
    return this.prismaService.review.update({
      where: { id },
      data: { score, comment },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }

  private async removeReview(reviewId: string): Promise<Review> {
    return this.prismaService.review.delete({
      where: { id: reviewId },
    });
  }
}
