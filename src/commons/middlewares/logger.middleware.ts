import { Injectable, NestMiddleware } from '@nestjs/common';
import { LoggerService } from '../logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const status = res.statusCode;
      this.logger.log(`${method} ${originalUrl} ${status} ${duration}ms`, 'HTTP');
    });
    next();
  }
}
