import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive, IsString } from 'class-validator';

@InputType()
export class CreateCartInput {
  @Field(() => String, { description: 'ID of the product to add' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @Field(() => Int, { description: 'Quantity to add' })
  @IsPositive()
  quantity: number;
}
