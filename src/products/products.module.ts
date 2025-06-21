import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { TagModule } from '../tag/tag.module';
import { DiscountModule } from '../discount/discount.module';

@Module({
  providers: [ProductsResolver, ProductsService],
  imports: [TagModule, DiscountModule],
})
export class ProductsModule {}
