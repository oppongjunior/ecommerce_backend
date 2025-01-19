import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUrl, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateCategoryInput {
  @IsNotEmpty()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters.' })
  @Field(() => String, { description: 'Name of the category', nullable: false })
  @Transform(({ value }) => value.trim().toLocaleLowerCase())
  name: string;

  @IsOptional()
  @IsUrl()
  @Field({ description: 'url of category' })
  image?: string;

  @IsOptional()
  @Field(() => String, { description: 'Description of the category', nullable: true })
  description?: string;
}
