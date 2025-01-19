import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsResolver } from './ratings.resolver';

@Module({
  providers: [RatingsResolver, RatingsService],
})
export class RatingsModule {}
