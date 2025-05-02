import { Module } from '@nestjs/common';
import { VariantService } from './variant.service';
import { VariantResolver } from './variant.resolver';

@Module({
  providers: [VariantResolver, VariantService],
})
export class VariantModule {}
