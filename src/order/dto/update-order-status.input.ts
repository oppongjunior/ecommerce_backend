import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { OrderStatusEnum } from '../enums/order.enum';

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID, { description: 'The ID of the order to update' })
  @IsNotEmpty({ message: 'Order ID must not be empty' })
  @IsUUID('4', { message: 'Order ID must be a valid UUID' })
  orderId: string;

  @Field(() => OrderStatusEnum, { description: 'The new status for the order' })
  @IsNotEmpty({ message: 'Status must not be empty' })
  status: OrderStatusEnum;
}
