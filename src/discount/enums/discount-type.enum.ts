import { registerEnumType } from '@nestjs/graphql';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

registerEnumType(DiscountType, { name: 'DiscountType' });
