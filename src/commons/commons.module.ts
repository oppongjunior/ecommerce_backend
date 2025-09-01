import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { LoggerService } from './logger.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [LoggerService, CloudinaryService],
  exports: [LoggerService],
})
export class CommonsModule {}
