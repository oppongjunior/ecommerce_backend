import {
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  @Post('/multiple-files')
  @UseInterceptors(FilesInterceptor('files', 3))
  async uploadProductImages(@UploadedFiles() images: Express.Multer.File[]) {
    if (!images || images.length === 0) {
      throw new Error('No files were uploaded!');
    }
    const uploadedFiles = await Promise.all(
      images.map((file) => this.cloudinaryService.uploadImage(file, 'ecommerce')),
    );
    return {
      message: 'Product images uploaded successfully',
      files: uploadedFiles.map((f) => ({ url: f['secure_url'], public_id: f['public_id'] })),
    };
  }

  @Post('/single-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCategoryImage(@UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new InternalServerErrorException('File upload failed!');
    }
    const result = await this.cloudinaryService.uploadImage(image, 'ecommerce');
    return { url: result['secure_url'], public_id: result['public_id'] };
  }
}
