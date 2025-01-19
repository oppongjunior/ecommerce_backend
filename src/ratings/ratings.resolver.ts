import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RatingsService } from './ratings.service';
import { Rating } from './entities/rating.entity';
import { CreateRatingInput } from './dto/create-rating.input';
import { UpdateRatingInput } from './dto/update-rating.input';

@Resolver(() => Rating)
export class RatingsResolver {
  constructor(private readonly ratingsService: RatingsService) {}

  @Mutation(() => Rating)
  createRating(@Args('createRatingInput') createRatingInput: CreateRatingInput) {
    return this.ratingsService.create(createRatingInput);
  }

  @Query(() => [Rating], { name: 'ratings' })
  findAll() {
    return this.ratingsService.findAll();
  }

  @Query(() => Rating, { name: 'rating' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.ratingsService.findOne(id);
  }

  @Mutation(() => Rating)
  updateRating(@Args('updateRatingInput') updateRatingInput: UpdateRatingInput) {
    return this.ratingsService.update(updateRatingInput.id, updateRatingInput);
  }

  @Mutation(() => Rating)
  removeRating(@Args('id', { type: () => ID }) id: string) {
    return this.ratingsService.remove(id);
  }
}
