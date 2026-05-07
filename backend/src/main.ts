import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  let httpsOptions = undefined;
  
  if (process.env.SSL_CERT && process.env.SSL_KEY) {
    try {
      httpsOptions = {
        cert: fs.readFileSync(process.env.SSL_CERT),
        key: fs.readFileSync(process.env.SSL_KEY),
      };
    } catch(e) {
      console.log('SSL files not found, running HTTP');
    }
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`♦ LocalKart API running on port ${port}/api/v1`);
}
bootstrap();
