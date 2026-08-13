import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CellBarcode } from '../cells/cell-barcode.entity';
import { Batch } from '../batch/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CellBarcode, Batch])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}