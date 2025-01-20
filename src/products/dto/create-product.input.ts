import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsUrl, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateProductInput {
  @IsNotEmpty()
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters.' })
  @Field(() => String, { description: 'Name of the product', nullable: false })
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsUrl()
  @Field(() => [String], { description: 'links to url of product images', nullable: true })
  image: string[];

  @IsOptional()
  @Field(() => String, { description: 'description of the product', nullable: true })
  description?: string;

  @IsNotEmpty()
  @Field(() => Float, { description: 'price of the product' })
  float: number;

  @IsOptional()
  @Field(() => String, { description: 'sku of product', nullable: true })
  sku?: string;

  @IsNotEmpty()
  @Field(() => Int, { description: 'description of the product' })
  quantity: number;

  @IsBoolean()
  @Field(() => Boolean, { defaultValue: true })
  isActive: boolean;

  @IsNotEmpty()
  @Field(() => Int)
  categoryId: string;

  @Field(() => Int, { nullable: true })
  subcategoryId: string;

  @Field(() => String, { nullable: true })
  brand?: string;
}
