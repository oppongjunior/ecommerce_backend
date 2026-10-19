import { Field, Float, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';
import { Tag } from '../../tag/entities/tag.entity';
import { Discount } from '../../discount/entities/discount.entity';
import { Prisma } from '@prisma/client';
import { Category } from '../../categories/entities/category.entity';
import { SubCategory } from '../../sub-categories/entities/sub-category.entity';
import { Variant } from '../../variant/entities/variant.entity';
import { Review } from '../../review/entities/review.entity';
import { Brand } from '../../brand/entities/brand.entity';

@ObjectType()
export class Product {
  @Field(() => String, { description: 'Id of product' })
  id: string;

  @Field(() => String, { description: 'Name of the product', nullable: false })
  name: string;

  @Field(() => [String], {
    description: 'links to url of product images',
    nullable: true,
  })
  images: string[];

  @Field(() => String, {
    description: 'description of the product',
    nullable: true,
  })
  description?: string;

  @Field(() => Float, { description: 'price of the product' })
  price: Prisma.Decimal;

  @Field(() => Float, { description: 'Discounted price of the product, if applicable', nullable: true })
  discountedPrice?: number;

  @Field(() => Discount, { description: 'Discount applied to the product, if any', nullable: true })
  appliedDiscount?: Discount;

  @Field(() => String, { description: 'unique id for product', nullable: true })
  sku?: string;

  @Field(() => Int, { description: 'description of the product' })
  quantity: number;

  @Field(() => Boolean, { defaultValue: false })
  isActive: boolean;

  @Field(() => String)
  categoryId: string;

  @Field(() => String, { nullable: true })
  subcategoryId?: string;

  @Field(() => Category)
  category?: Category;

  @Field(() => SubCategory)
  subcategory?: SubCategory;

  @Field(() => Brand, { nullable: true })
  brand?: Brand;

  @Field(() => [Variant], { nullable: true })
  variants?: Variant[];

  @Field(() => [Discount], { nullable: true })
  discounts?: Discount[];

  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  @Field(() => [Tag])
  tags?: Tag[];

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
