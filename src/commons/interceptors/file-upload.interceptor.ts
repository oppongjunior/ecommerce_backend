import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import e from 'express';
import { extname } from 'path';

export class FileUploadInterceptor {
  static create(destination: string, numberOfFiles: number = 1, maxSizeMB: number = 2) {
    const options: MulterOptions = {
      storage: this.createStorage(destination),
      fileFilter: this.imageFilter(),
      limits: { fileSize: maxSizeMB * 1024 * 1024, files: numberOfFiles },
    };
    if (numberOfFiles === 1) return FileInterceptor('file', options);
    return FilesInterceptor('files', numberOfFiles, options);
  }

  static createStorage(destination: string) {
    return diskStorage({
      destination,
      filename(req: e.Request, file, callback) {
        const timeStamp = Date.now();
        const ext = extname(file.originalname);
        const filename = `${timeStamp}${ext}`;
        callback(null, filename);
      },
    });
  }

  static imageFilter() {
    return (req: any, file: { mimetype: string }, callback: (arg0: Error, arg1: boolean) => void) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    };
  }
}
