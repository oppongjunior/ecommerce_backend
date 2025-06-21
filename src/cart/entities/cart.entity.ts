import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { CartItem } from './cart-item.entity';

@ObjectType()
export class Cart {
  @Field(() => ID, { description: 'Unique identifier of the cart' })
  id: string;

  @Field(() => String, { description: 'ID of the user owning the cart' })
  userId: string;

  @Field(() => [CartItem], { description: 'Items in the cart' })
  items: CartItem[];

  @Field(() => Float, { description: 'Total original price of all items' })
  total: number;

  @Field(() => Float, { description: 'Total discount amount applied' })
  discountTotal: number;

  @Field(() => Float, { description: 'Final total after discounts', nullable: true })
  finalTotal?: number;

  @Field(() => Date, { description: 'Timestamp when the cart was created' })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Timestamp when the cart was last updated',
  })
  updatedAt: Date;
}
