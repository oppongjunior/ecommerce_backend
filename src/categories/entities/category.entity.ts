import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { SubCategory } from '../../sub-categories/entities/sub-category.entity';

@ObjectType()
export class Category {
  @Field(() => ID, { description: 'Unique identifier of the category' })
  id: string;

  @Field(() => String, { description: 'Name of the category (e.g., "Clothing")' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional description of the category (max 500 characters)',
  })
  description?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional HTTPS URL to an image representing the category',
  })
  image?: string;

  @Field(() => [Product], {
    description: 'List of products belonging to this category (empty if none)',
  })
  products: Product[];

  @Field(() => [SubCategory], {
    description: 'List of subcategories under this category (empty if none)',
  })
  subcategories: SubCategory[];

  @Field(() => Date, { description: 'Timestamp when the category was created' })
  createdAt: Date;

  @Field(() => Date, { description: 'Timestamp when the category was last updated' })
  updatedAt: Date;
}
