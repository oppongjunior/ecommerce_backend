import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistResolver } from './wishlist.resolver';

@Module({
  providers: [WishlistResolver, WishlistService],
})
export class WishlistModule {}
