import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field(() => ID, { description: 'The ID of the shipping address for the order' })
  @IsNotEmpty({ message: 'Shipping address ID must not be empty' })
  @IsUUID('4', { message: 'Shipping address ID must be a valid UUID' })
  shippingAddressId: string;
}
