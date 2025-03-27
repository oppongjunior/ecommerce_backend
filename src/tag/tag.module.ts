import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagResolver } from './tag.resolver';

@Module({
  providers: [TagResolver, TagService],
  exports: [TagService],
})
export class TagModule {}
