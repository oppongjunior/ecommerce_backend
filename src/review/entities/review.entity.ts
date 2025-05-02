import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class Review {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  score: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => ID)
  productId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => Product)
  product: Product;
}
