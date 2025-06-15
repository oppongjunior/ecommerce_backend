import { CreateAddressInput } from './create-address.input';
import { InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateAddressInput extends PartialType(CreateAddressInput) {}
