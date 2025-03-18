import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field(() => String, { description: 'ID of the cart item to update' })
  @IsNotEmpty({ message: 'Cart item ID is required' })
  @IsString()
  cartItemId: string;

  @Field(() => Int, { description: 'New quantity for the cart item (0 to remove)' })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(0, { message: 'Quantity cannot be negative' })
  quantity: number;
}
