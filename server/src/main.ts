import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body parser limit for base64 images (10MB)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for extra properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // Enable CORS for mobile app
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;

  // Listen on 0.0.0.0 to accept connections from external devices (mobile phones)
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📱 Access from mobile: http://192.168.1.101:${port}`);
}
bootstrap();
