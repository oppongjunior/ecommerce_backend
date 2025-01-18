import { CreateSubCategoryInput } from './create-sub-category.input';
import { Field, ID, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateSubCategoryInput extends PartialType(CreateSubCategoryInput) {
  @Field(() => ID)
  id: string;
}
