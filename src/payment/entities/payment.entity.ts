import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Order } from '../../order/entities/order.entity';

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => Order)
  order: Order;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  paymentMethod: string;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => String, { nullable: true })
  transactionId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON string representing the transaction details',
  })
  paymentDetails?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
