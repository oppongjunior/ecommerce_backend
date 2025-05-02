import { PaystackEvent } from '../enums/paystack-event.enum';

export type PaystackWebhookDto = {
  event: PaystackEvent;
  data: Data;
};

type Data = {
  id?: number;
  domain?: string;
  status?: string;
  reference?: string;
  amount?: number;

  gateway_response?: string;
  paid_at?: string;
  created_at?: string;
  channel?: string;
  currency?: string;
  ip_address?: string;
  metadata?: any;

  message?: any;
  fees: any;
  log: any;
  customer: any;
  authorization: any;
  plan: any;
};

export class PaystackCallbackDto {
  reference: string;
}
