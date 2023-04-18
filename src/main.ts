import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { middleware } from 'express-ctx';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist set to true makes sure we do not have unknown properties in the body of our requests. every property will be stripped out
      whitelist: true,
    }),
  );
  app.use(middleware);
  await app.listen(9287);
}
bootstrap();
