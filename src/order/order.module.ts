import { Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersResolver } from './order.resolver';
import { CartModule } from '../cart/cart.module';
import { DiscountModule } from '../discount/discount.module';

@Module({
  providers: [OrdersResolver, OrdersService],
  imports: [CartModule, DiscountModule],
})
export class OrderModule {}
