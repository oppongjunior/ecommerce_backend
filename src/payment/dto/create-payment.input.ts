import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreatePaymentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @Field(() => String, { defaultValue: 'GHS' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
