import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => String, { description: 'Id of product' })
  id: string;

  @Field(() => String, { description: 'Name of the product', nullable: false })
  name: string;

  @Field(() => [String], { description: 'links to url of product images', nullable: true })
  images: string[];

  @Field(() => String, { description: 'description of the product', nullable: true })
  description?: string;

  @Field(() => Float, { description: 'price of the product' })
  price: number;

  @Field(() => String, { description: 'sku of product', nullable: true })
  sku?: string;

  @Field(() => Int, { description: 'description of the product' })
  quantity: number;

  @Field(() => Boolean, { defaultValue: false })
  isActive: boolean;

  @Field(() => String)
  categoryId: string;

  @Field(() => String, { nullable: true })
  subcategoryId?: string;

  @Field(() => String, { nullable: true })
  brand?: string;
}
