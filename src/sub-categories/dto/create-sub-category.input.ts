import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUrl, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateSubCategoryInput {
  @Field(() => String, { description: 'The name of the subcategory (e.g., "Shirts")' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Subcategory name is required' })
  @Length(2, 50, { message: 'Subcategory name must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z0-9\s-]+$/, {
    message: 'Subcategory name can only contain letters, numbers, spaces, and hyphens',
  })
  name: string;

  @Field(() => String, { description: 'The ID of the parent category' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId: string;

  @Field(() => String, { nullable: true, description: 'Optional HTTPS URL to an image' })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Image must be a valid HTTPS URL' })
  image?: string;

  @Field(() => String, { nullable: true, description: 'Optional description (max 500 characters)' })
  @IsOptional()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}
