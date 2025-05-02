import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => ID)
  productId: string;

  @Field(() => ID, { nullable: true })
  variantId?: string;

  @Field()
  quantity: number;

  @Field(() => Float)
  priceAtOrder: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Product)
  product: Product;
}
