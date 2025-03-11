import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';

@ObjectType()
export class SubCategory {
  @Field(() => ID, { description: 'Id of category' })
  id: string;

  @Field(() => String, { description: 'Name of the category' })
  name: string;

  @Field(() => String, { description: 'Description of the category', nullable: true })
  description?: string;

  @Field(() => ID, { description: 'Id of parent category', nullable: false })
  categoryId: string;

  @Field({ description: 'url of sub category', nullable: true })
  image?: string;

  @Field(() => [Product], { nullable: true })
  products: Product[];

  @Field(() => SubCategory, { nullable: true })
  category: Category;
}
