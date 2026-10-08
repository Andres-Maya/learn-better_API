import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { Area } from '../areas/entities/area.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Student } from '../students/entities/student.entity';

export interface DatabaseEnv {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities: [Student, Area, Grade],
    migrations: [join(__dirname, 'migrations', '*.js')],
    synchronize: false,
  };
}
