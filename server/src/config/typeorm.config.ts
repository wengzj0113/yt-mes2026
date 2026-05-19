import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mssql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 1433),
  username: configService.get<string>('DB_USERNAME', 'sa'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE', 'YT_MES'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
