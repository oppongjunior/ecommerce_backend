import {
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadInterceptor } from './interceptors/file-upload.interceptor';

@Controller('upload')
export class UploadController {
  @Post('/profile-image')
  @UseInterceptors(FileUploadInterceptor.create('./upload/profile-image'))
  uploadProfileImage(@UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new InternalServerErrorException('File upload failed!');
    }
  }

  @Post('/products-images')
  @UseInterceptors(FileUploadInterceptor.create('./upload/products', 3))
  uploadProductImages(@UploadedFiles() images: Express.Multer.File[]) {
    if (!images || images.length === 0) {
      throw new Error('No files were uploaded!');
    }
    const uploadedFiles = images.map((file) => file.filename);
    return { message: 'Product images uploaded successfully', files: uploadedFiles };
  }

  @Post('/category-image')
  @UseInterceptors(FileUploadInterceptor.create('./upload/categories'))
  uploadCategoryImage(@UploadedFile() image: string) {
    if (!image) {
      throw new InternalServerErrorException('File upload failed!');
    }
  }
}
