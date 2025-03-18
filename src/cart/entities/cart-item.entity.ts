import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class CartItem {
  @Field(() => ID, { description: 'Unique identifier of the cart item' })
  id: string;

  @Field(() => String, { description: 'ID of the product in the cart' })
  productId: string;

  @Field(() => Product, { description: 'The product in the cart' })
  product: Product;

  @Field(() => Int, { description: 'Quantity of the product in the cart' })
  quantity: number;

  @Field(() => Date, { description: 'Timestamp when the item was added' })
  createdAt: Date;

  @Field(() => Date, { description: 'Timestamp when the item was last updated' })
  updatedAt: Date;
}
