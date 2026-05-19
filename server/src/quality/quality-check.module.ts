import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityCheck } from './quality-check.entity';
import { QualityCheckService } from './quality-check.service';
import { QualityCheckController } from './quality-check.controller';
import { QualityController } from './quality.controller';
import { Batch } from '../batch/batch.entity';
import { CellBarcode } from '../cells/cell-barcode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QualityCheck, Batch, CellBarcode])],
  providers: [QualityCheckService],
  controllers: [QualityCheckController, QualityController],
})
export class QualityCheckModule {}
