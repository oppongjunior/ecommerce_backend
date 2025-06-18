import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { Review } from './entities/review.entity';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';

@Roles(Role.USER, Role.SUPER_ADMIN, Role.ADMIN)
@Resolver(() => Review)
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Query(() => Review, {
    name: 'review',
    description: 'Retrieves a specific review by ID',
  })
  async getReview(@Args('reviewId', { type: () => String }) reviewId: string) {
    return this.reviewService.getReview(reviewId);
  }

  @Query(() => [Review], {
    name: 'productReviews',
    description: 'Retrieves all reviews for a product',
  })
  async getProductReviews(@Args('productId', { type: () => String }) productId: string) {
    return this.reviewService.getProductReviews(productId);
  }

  @Query(() => [Review], {
    name: 'userReviews',
    description: 'Retrieves all reviews by the user',
  })
  async getUserReviews(@ActiveUser('id') userId: string) {
    return this.reviewService.getUserReviews(userId);
  }

  @Mutation(() => Review, {
    name: 'createReview',
    description: 'Creates a review for a product',
  })
  @Roles(Role.USER)
  async createReview(
    @ActiveUser('id') userId: string,
    @Args('input', { type: () => CreateReviewInput }) input: CreateReviewInput,
  ) {
    return this.reviewService.createReview(userId, input);
  }

  @Mutation(() => Review, {
    name: 'updateReview',
    description: 'Updates a user’s review',
  })
  @Roles(Role.USER)
  async updateReview(
    @ActiveUser('id') userId: string,
    @Args('input', { type: () => UpdateReviewInput }) input: UpdateReviewInput,
  ) {
    return this.reviewService.updateReview(userId, input);
  }

  @Mutation(() => Review, {
    name: 'deleteReview',
    description: 'Deletes a user’s review',
  })
  async deleteReview(@ActiveUser('id') userId: string, @Args('reviewId', { type: () => String }) reviewId: string) {
    return this.reviewService.deleteReview(userId, reviewId);
  }
}
