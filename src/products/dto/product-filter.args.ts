import { Field, Float, InputType } from '@nestjs/graphql';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class ProductFilterArgs {
  @Field(() => String, { nullable: true, description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Field(() => String, { nullable: true, description: 'Filter by subcategory ID' })
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @Field(() => Boolean, { nullable: true, description: 'Filter by active status', defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => String, { nullable: true, description: 'Filter by name, description, or tags (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => String, { nullable: true, description: 'Filter products created after this ISO date' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @Field(() => Float, { nullable: true, description: 'Filter by minimum price (inclusive)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @Field(() => Float, { nullable: true, description: 'Filter by maximum price (inclusive)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @Field(() => String, { nullable: true, description: 'Filter by brand name (exact match)' })
  @IsOptional()
  @IsString()
  brand?: string;
}
