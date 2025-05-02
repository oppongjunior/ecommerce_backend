import { CreateAddressInput } from './create-address.input';
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive } from 'class-validator';

@InputType()
export class UpdateAddressInput extends PartialType(CreateAddressInput) {
  @IsNotEmpty()
  @IsPositive()
  @Field(() => String)
  id: string;
}
