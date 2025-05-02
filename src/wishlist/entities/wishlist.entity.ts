import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class Wishlist {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => [Product])
  products: Product[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
