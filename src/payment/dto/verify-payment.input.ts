import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class VerifyPaymentInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  reference: string;
}
