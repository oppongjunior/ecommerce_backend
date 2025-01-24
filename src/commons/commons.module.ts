import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { UploadController } from './upload.controller';

@Module({
  providers: [PasswordService],
  exports: [PasswordService],
  controllers: [UploadController],
})
export class CommonsModule {}
