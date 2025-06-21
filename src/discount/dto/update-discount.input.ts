import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateDiscountInput } from './create-discount.input';

@InputType()
export class UpdateDiscountInput extends PartialType(CreateDiscountInput) {
  @Field(() => ID, { description: 'The ID of the discount to update' })
  @IsNotEmpty({ message: 'Discount ID is required' })
  @IsString({ message: 'Discount ID must be a string' })
  id: string;
}
