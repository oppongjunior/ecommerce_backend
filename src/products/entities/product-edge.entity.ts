import { Field, ObjectType } from '@nestjs/graphql';
import { Product } from './product.entity';

@ObjectType()
export class ProductEdge {
  @Field(() => String, { description: 'cursor to identity resource', nullable: false })
  cursor: string;

  @Field(() => Product, { description: 'product record', nullable: false })
  node: Product;
}
