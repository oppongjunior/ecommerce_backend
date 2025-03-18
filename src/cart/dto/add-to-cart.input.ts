import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive, IsString } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field(() => String, { description: 'ID of the product to add to the cart' })
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsString()
  productId: string;

  @Field(() => Int, { description: 'Quantity of the product to add' })
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;
}
