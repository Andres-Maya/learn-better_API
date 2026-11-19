import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { setupSwagger } from './swagger';

// Shared by main.ts and the e2e tests, so both run the app with the same setup.
export function configureApp(app: INestApplication): void {
  app.use(helmet());

  // Without CORS_ORIGIN, browsers on other domains cannot call the API.
  const corsOrigin = app.get(ConfigService).get<string>('CORS_ORIGIN');
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((origin) => origin.trim()),
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  setupSwagger(app);
}
