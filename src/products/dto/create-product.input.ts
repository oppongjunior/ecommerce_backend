import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsPositive, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateProductInput {
  @IsNotEmpty()
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters.' })
  @Field(() => String, { description: 'Name of the product', nullable: false })
  @Transform(({ value }) => value?.trim().toLowerCase())
  name: string;

  @IsOptional()
  @Field(() => [String], { description: 'links to url of product images', nullable: true })
  images: string[];

  @IsOptional()
  @Field(() => String, { description: 'description of the product', nullable: true })
  description?: string;

  @IsNotEmpty()
  @Field(() => Float, { description: 'price of the product' })
  price: number;

  @IsOptional()
  @Field(() => String, { description: 'sku of product', nullable: true })
  @Transform(({ value }) => value?.trim().toLowerCase())
  sku?: string;

  @IsNotEmpty()
  @Field(() => Int, { description: 'description of the product' })
  @IsPositive()
  quantity: number;

  @IsBoolean()
  @Field(() => Boolean, { defaultValue: false })
  isActive: boolean;

  @IsNotEmpty()
  @Field(() => String)
  categoryId: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  subcategoryId?: string;

  @Field(() => String, { nullable: true })
  @Transform(({ value }) => value?.trim().toLowerCase())
  brand?: string;
}
