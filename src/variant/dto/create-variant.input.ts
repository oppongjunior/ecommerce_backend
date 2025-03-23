import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateVariantInput {
  @Field({ nullable: true, description: 'Size of the variant' })
  @IsOptional()
  @IsString({ message: 'Size must be a string' })
  size?: string;

  @Field({ nullable: true, description: 'Color of the variant' })
  @IsOptional()
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @Field({ description: 'Quantity in stock' })
  @IsNotEmpty({ message: 'Quantity must not be empty' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  quantity: number;

  @Field(() => Float, { description: 'Price of the variant' })
  @IsNotEmpty({ message: 'Price must not be empty' })
  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @Field(() => ID, { description: 'ID of the associated product' })
  @IsNotEmpty({ message: 'Product ID must not be empty' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId: string;

  @Field(() => ID, { nullable: true, description: 'ID of the associated discount' })
  @IsOptional()
  @IsUUID('4', { message: 'Discount ID must be a valid UUID' })
  discountId?: string;
}
