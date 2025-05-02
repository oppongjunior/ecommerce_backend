import { CreateProductInput } from './create-product.input';
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive } from 'class-validator';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @IsNotEmpty()
  @IsPositive()
  @Field(() => String)
  id: string;
}
