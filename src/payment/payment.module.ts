import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { PaymentController } from './payment.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [PaymentResolver, PaymentService, ConfigService],
  controllers: [PaymentController],
})
export class PaymentModule {}
