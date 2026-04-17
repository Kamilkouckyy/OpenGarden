import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-User-Id', 'X-User-Role'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OpenGarden API')
    .setDescription(
      'REST API pro správu komunitní zahrady.\n\n' +
        '**Autentizace:** Přihlas se přes `POST /auth/login` a získej JWT token. ' +
        'Token předávej jako `Authorization: Bearer <token>` header.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Přihlášení a JWT')
    .addTag('users', 'Správa uživatelů')
    .addTag('garden-beds', 'Záhony – rezervace a správa')
    .addTag('tasks', 'Úkoly')
    .addTag('equipment', 'Sdílené vybavení')
    .addTag('reports', 'Hlášení problémů')
    .addTag('events', 'Komunitní akce')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger docs:          http://localhost:${port}/api/docs`);
}
bootstrap();
