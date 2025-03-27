import { CreateReviewInput } from './create-review.input';
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateReviewInput extends PartialType(CreateReviewInput) {
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  id: string;
}
