import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { LoggerService } from './logger.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonsModule {}
