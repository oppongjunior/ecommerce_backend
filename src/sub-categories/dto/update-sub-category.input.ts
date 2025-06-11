import { CreateSubCategoryInput } from './create-sub-category.input';
import { InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateSubCategoryInput extends PartialType(CreateSubCategoryInput) {}
