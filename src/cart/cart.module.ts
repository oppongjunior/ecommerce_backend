import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartResolver } from './cart.resolver';
import { DiscountModule } from '../discount/discount.module';

@Module({
  providers: [CartResolver, CartService],
  exports: [CartService],
  imports: [DiscountModule],
})
export class CartModule {}
