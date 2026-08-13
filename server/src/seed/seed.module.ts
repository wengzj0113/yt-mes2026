import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from './seed.service';
import { User } from '../user/user.entity';
import { Department } from '../department/department.entity';
import { Equipment } from '../equipment/equipment.entity';
import { ProcessDictionary } from '../master-data/process-dictionary/process-dictionary.entity';
import { SystemConfig } from '../system/entities/config.entity';
import { Batch } from '../batch/batch.entity';
import { CellBarcode } from '../cells/cell-barcode.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 1433,
      username: process.env.DB_USERNAME || 'sa',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'YT_MES',
      entities: [User, Department, Equipment, ProcessDictionary, SystemConfig, Batch, CellBarcode],
      synchronize: process.env.SEED_ALLOW_SYNC === 'true',
      namingStrategy: new SnakeNamingStrategy(),
      options: { encrypt: false, trustServerCertificate: true },
    }),
    TypeOrmModule.forFeature([User, Department, Equipment, ProcessDictionary, SystemConfig, Batch, CellBarcode]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
