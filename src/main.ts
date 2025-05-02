import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './commons/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false,
  });

  //set custom logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(3000);
}

bootstrap();
