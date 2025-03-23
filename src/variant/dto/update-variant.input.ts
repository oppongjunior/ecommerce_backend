import { CreateVariantInput } from './create-variant.input';
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateVariantInput extends PartialType(CreateVariantInput) {
  @Field(() => String)
  @IsNotEmpty({ message: 'Variant ID must not be empty' })
  @IsUUID('4', { message: 'Variant ID must be a valid UUID' })
  id: string;
}
