import { webcrypto } from 'crypto';
if (!(global as any).crypto) { (global as any).crypto = webcrypto; }

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
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
  
  app.use(helmet({
    contentSecurityPolicy: false, // API-only; CSP set by frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.useWebSocketAdapter(new IoAdapter(app));
  
  app.setGlobalPrefix('api/v1');
  
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction
      ? ['https://localkart.store', 'https://www.localkart.store']
      : ['https://localkart.store', 'https://www.localkart.store', 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
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

  const port = process.env.PORT || 443;
  await app.listen(port);
  console.log(`♦ LocalKart API running on port ${port}/api/v1`);
}

bootstrap();
