import { CreateBrandInput } from './create-brand.input';
import { InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateBrandInput extends PartialType(CreateBrandInput) {}
