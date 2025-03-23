import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class Variant {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  size?: string;

  @Field({ nullable: true })
  color?: string;

  @Field()
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field(() => ID)
  productId: string;

  @Field(() => Product)
  product: Product;

  @Field(() => ID, { nullable: true })
  discountId?: string;
}
