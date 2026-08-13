import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityCheck } from './quality-check.entity';
import { QualityCheckService } from './quality-check.service';
import { QualityCheckController } from './quality-check.controller';
import { QualityController } from './quality.controller';
import { Batch } from '../batch/batch.entity';
import { BatchStatusLog } from '../batch/batch-status-log.entity';
import { CellBarcode } from '../cells/cell-barcode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QualityCheck, Batch, BatchStatusLog, CellBarcode])],
  providers: [QualityCheckService],
  controllers: [QualityCheckController, QualityController],
  exports: [QualityCheckService],
})
export class QualityCheckModule {}
