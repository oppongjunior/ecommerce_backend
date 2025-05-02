import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Field(() => Int, { description: 'Rate number 1 - 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  comment?: string;
}
