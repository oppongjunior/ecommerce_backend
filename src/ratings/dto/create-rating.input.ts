import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsPositive, Max, Min } from 'class-validator';

@InputType()
export class CreateRatingInput {
  @IsNotEmpty()
  @IsPositive()
  @Max(5)
  @Min(1)
  @Field(() => Int, { description: 'rating score' })
  score: number;

  @IsOptional()
  @Field(() => String, { description: 'comment about rating', nullable: true })
  comment?: string;

  @IsNotEmpty()
  @Field(() => ID, { description: 'Id of user', nullable: false })
  userId: string;

  @IsNotEmpty()
  @Field(() => ID, { description: 'Id of product', nullable: false })
  productId: string;
}
