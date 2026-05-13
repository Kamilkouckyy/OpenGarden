import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { BetterAuthService } from './auth/better-auth.service';

const loadEsm = new Function('specifier', 'return import(specifier)') as <T = any>(
  specifier: string,
) => Promise<T>;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const betterAuthService = app.get(BetterAuthService);
  const betterAuth = await betterAuthService.getAuth();
  const { toNodeHandler } = await loadEsm<{ toNodeHandler: any }>('better-auth/node');
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.all('/api/auth/*', toNodeHandler(betterAuth));
  app.use(json());
  app.use(urlencoded({ extended: true }));

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
        '**Autentizace:** Přihlášení probíhá přes Better Auth OAuth endpointy na `/api/auth/*`.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Better Auth OAuth session')
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
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger docs:          http://localhost:${port}/api/docs`);
}
bootstrap();
