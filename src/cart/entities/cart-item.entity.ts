import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { Variant } from '../../variant/entities/variant.entity';
import { Discount } from '../../discount/entities/discount.entity';

@ObjectType()
export class CartItem {
  @Field(() => ID, { description: 'Unique identifier of the cart item' })
  id: string;

  @Field(() => String, { description: 'ID of the product in the cart' })
  productId: string;

  @Field(() => Product, { description: 'The product in the cart' })
  product: Product;

  @Field(() => Variant, { description: 'Variant of the product, if applicable', nullable: true })
  variant?: Variant;

  @Field(() => Float, { description: 'Original price per unit of the product or variant', nullable: true })
  originalPrice?: number;

  @Field(() => Float, { description: 'Discounted price per unit, if applicable', nullable: true })
  discountedPrice?: number;

  @Field(() => Discount, { description: 'Discount applied to the cart item, if any', nullable: true })
  appliedDiscount?: Discount;

  @Field(() => Int, { description: 'Quantity of the product in the cart' })
  quantity: number;

  @Field(() => Date, { description: 'Timestamp when the item was added' })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Timestamp when the item was last updated',
  })
  updatedAt: Date;
}
