import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class Brand {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field(() => [Product], { nullable: true })
  products?: Product[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
