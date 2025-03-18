import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUrl, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateCategoryInput {
  @Field(() => String, { description: 'The name of the category (e.g., "Electronics")' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Category name is required' })
  @Length(2, 50, { message: 'Category name must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z0-9\s-]+$/, { message: 'Category name can only contain letters, numbers, spaces, and hyphens' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'A URL to an image representing the category (must be HTTPS)',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Image must be a valid HTTPS URL' })
  image?: string;

  @Field(() => String, {
    nullable: true,
    description: 'A brief description of the category (max 500 characters)',
  })
  @IsOptional()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}
