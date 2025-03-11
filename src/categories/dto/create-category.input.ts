import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUrl, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateCategoryInput {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters.' })
  @Field(() => String, { description: 'Name of the category' })
  name: string;

  @IsOptional()
  @IsUrl()
  @Field({ description: 'url of category', nullable: true })
  image?: string;

  @IsOptional()
  @Field(() => String, { description: 'Description of the category', nullable: true })
  description?: string;
}
