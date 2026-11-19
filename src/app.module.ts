import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/database.config';
import { GradesModule } from './grades/grades.module';
import { HealthModule } from './health/health.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        buildDataSourceOptions({
          DB_HOST: config.get('DB_HOST', { infer: true }),
          DB_PORT: config.get('DB_PORT', { infer: true }),
          DB_USER: config.get('DB_USER', { infer: true }),
          DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
          DB_NAME: config.get('DB_NAME', { infer: true }),
        }),
    }),
    // 100 requests per minute per IP. Jest sets NODE_ENV=test, so tests are not throttled.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      skipIf: () => process.env.NODE_ENV === 'test',
      errorMessage:
        'Demasiadas peticiones: espera un minuto e inténtalo de nuevo',
    }),
    // Telemetry from observe.nestjs.com. Only loaded when both keys are set in .env,
    // so development and tests do not start its background worker.
    ConditionalModule.registerWhen(
      ObserveModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
          appKey: config.get('OBSERVE_APP_KEY', { infer: true })!,
          appSecret: config.get('OBSERVE_APP_SECRET', { infer: true })!,
          serviceId: 'learn-better_api',
        }),
      }),
      (env) => Boolean(env.OBSERVE_APP_KEY && env.OBSERVE_APP_SECRET),
    ),
    StudentsModule,
    AreasModule,
    GradesModule,
    RecommendationsModule,
    UsersModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
