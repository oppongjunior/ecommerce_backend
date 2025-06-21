import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountResolver } from './discount.resolver';

@Module({
  providers: [DiscountResolver, DiscountService],
  exports: [DiscountService],
})
export class DiscountModule {}
