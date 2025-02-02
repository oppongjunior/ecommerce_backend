import { CreateCategoryInput } from './create-category.input';
import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field({ nullable: false })
  id: string;
}
