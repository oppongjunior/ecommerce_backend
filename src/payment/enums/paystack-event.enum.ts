import { registerEnumType } from '@nestjs/graphql';

export enum PaystackEvent {
  CHARGE_SUCCESS = 'charge.success',
  CHARGE_FAILED = 'charge.failed',
}

registerEnumType(PaystackEvent, { name: 'PaystackEvent' });
