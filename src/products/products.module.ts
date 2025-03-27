import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { TagModule } from '../tag/tag.module';

@Module({
  providers: [ProductsResolver, ProductsService],
  imports: [TagModule],
})
export class ProductsModule {}
