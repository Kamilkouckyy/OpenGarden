import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
        '**Autentizace (dočasně):** předej `X-User-Id` header s ID uživatele. ' +
        'Bude nahrazeno JWT po implementaci auth modulu.',
    )
    .setVersion('1.0')
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
