import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Rating {
  @Field(() => ID)
  id: string;

  @Field(() => Int, { description: 'rating score' })
  score: number;

  @Field(() => String, { description: 'comment about rating' })
  comment?: string;

  @Field(() => ID, { description: 'Id of product' })
  productId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => Product, { description: 'Id of product' })
  product: Product;
}
