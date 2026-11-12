import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env.validation';
import { buildDataSourceOptions } from './database.config';

// Used only by the TypeORM CLI, which runs outside of Nest and its ConfigModule.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default new DataSource(buildDataSourceOptions(validateEnv(process.env)));
