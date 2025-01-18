import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class CreateSubCategoryInput {
  @IsNotEmpty()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters.' })
  @Field(() => String, { description: 'Name of the category', nullable: false })
  @Transform(({ value }) => value.trim().toLocaleLowerCase())
  name: string;

  @Field(() => ID, { description: 'Id of parent category', nullable: false })
  categoryId: string;

  @IsOptional()
  @Field(() => String, { description: 'Description of the category', nullable: true })
  description?: string;
}
