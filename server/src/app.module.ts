import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DepartmentModule } from './department/department.module';
import { EquipmentModule } from './equipment/equipment.module';
import { HealthModule } from './health/health.module';
import { BatchModule } from './batch/batch.module';
import { BatchingModule } from './processes/batching/batching.module';
import { CoatingModule } from './processes/coating/coating.module';
import { RollerPressingModule } from './processes/roller-pressing/roller-pressing.module';
import { SlittingModule } from './processes/slitting/slitting.module';
import { SortingModule } from './processes/sorting/sorting.module';
import { ElectrodeModule } from './processes/electrode/electrode.module';
import { WindingModule } from './processes/winding/winding.module';
import { AssemblyModule } from './processes/assembly/assembly.module';
import { BakingModule } from './processes/baking/baking.module';
import { InjectionModule } from './processes/injection/injection.module';
import { WrappingModule } from './processes/wrapping/wrapping.module';
import { FormationModule } from './processes/formation/formation.module';
import { GradingModule } from './processes/grading/grading.module';
import { QualityCheckModule } from './quality/quality-check.module';
import { MaterialWarehouseModule } from './material/material-warehouse.module';
import { CellBarcodeModule } from './cells/cell-barcode.module';
import { ProcessStatusModule } from './processes/process-status/process-status.module';
import { ProcessDictionaryModule } from './master-data/process-dictionary/process-dictionary.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DashboardModule } from './dashboard/dashboard.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '1433'), 10),
        username: config.get<string>('DB_USERNAME', 'sa'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE', 'YT_MES'),
        synchronize: config.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true,
        namingStrategy: new SnakeNamingStrategy(),
        options: {
          encrypt: false,
          trustServerCertificate: true,
          connectTimeout: 15000,
          requestTimeout: 30000,
          cancelTimeout: 10000,
        },
        extra: {
          max: 20,
          min: 2,
          connectionTimeout: 15000,
          requestTimeout: 30000,
        },
      }),
    }),
    AuthModule,
    UserModule,
    DepartmentModule,
    EquipmentModule,
    HealthModule,
    BatchModule,
    BatchingModule,
    CoatingModule,
    RollerPressingModule,
    SlittingModule,
    SortingModule,
    ElectrodeModule,
    WindingModule,
    AssemblyModule,
    BakingModule,
    InjectionModule,
    WrappingModule,
    FormationModule,
    GradingModule,
    QualityCheckModule,
    MaterialWarehouseModule,
    CellBarcodeModule,
    ProcessStatusModule,
    ProcessDictionaryModule,
    DashboardModule,
    SystemModule,
  ],
})
export class AppModule {}
