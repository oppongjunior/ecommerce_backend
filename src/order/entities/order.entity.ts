import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { OrderStatusEnum } from '../enums/order.enum';
import { OrderStatus } from '@prisma/client';
import { OrderItem } from './order-item.entity';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => OrderStatusEnum)
  status: OrderStatus;

  @Field(() => ID)
  shippingAddressId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [OrderItem])
  items: OrderItem[];
}
