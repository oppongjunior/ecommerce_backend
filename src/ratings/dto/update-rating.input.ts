import { CreateRatingInput } from './create-rating.input';
import { Field, ID, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateRatingInput extends PartialType(CreateRatingInput) {
  @Field(() => ID, { nullable: false })
  id: string;
}
