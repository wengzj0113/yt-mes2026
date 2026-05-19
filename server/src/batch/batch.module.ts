import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './batch.entity';
import { BatchStatusLog } from './batch-status-log.entity';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { CellBarcode } from '../cells/cell-barcode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Batch, BatchStatusLog, CellBarcode])],
  providers: [BatchService],
  controllers: [BatchController],
  exports: [BatchService],
})
export class BatchModule {}
