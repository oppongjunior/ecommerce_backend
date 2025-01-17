import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @IsNotEmpty()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters.' })
  @Field(() => String, { description: 'Name of the category', nullable: false })
  @Tra
  name: string;

  @IsOptional()
  @Field(() => String, { description: 'Description of the category', nullable: true })
  description?: string;
}
