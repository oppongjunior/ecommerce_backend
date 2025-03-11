import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { SubCategory } from '../../sub-categories/entities/sub-category.entity';

@ObjectType()
export class Category {
  @Field(() => ID, { description: 'Id of category' })
  id: string;

  @Field(() => String, { description: 'Name of the category', nullable: false })
  name: string;

  @Field(() => String, { description: 'Description of the category', nullable: true })
  description?: string;

  @Field(() => [Product], { defaultValue: [] })
  products: Product[];

  @Field({ description: 'url of category', nullable: true })
  image?: string;

  @Field(() => [SubCategory], { defaultValue: [] })
  subcategories: SubCategory[];
}
