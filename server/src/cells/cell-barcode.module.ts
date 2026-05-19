import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellBarcode } from './cell-barcode.entity';
import { CellBarcodeService } from './cell-barcode.service';
import { CellBarcodeController } from './cell-barcode.controller';
import { Batch } from '../batch/batch.entity';
import { ProcessStatusModule } from '../processes/process-status/process-status.module';

@Module({
  imports: [TypeOrmModule.forFeature([CellBarcode, Batch]), ProcessStatusModule],
  providers: [CellBarcodeService],
  controllers: [CellBarcodeController],
})
export class CellBarcodeModule {}
