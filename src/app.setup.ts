import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { setupSwagger } from './swagger';

// Shared by main.ts and the e2e tests, so both run the app with the same setup.
export function configureApp(app: INestApplication): void {
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  setupSwagger(app);
}
