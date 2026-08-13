import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellBarcode } from './cell-barcode.entity';
import { CellBarcodeService } from './cell-barcode.service';
import { CellBarcodeController } from './cell-barcode.controller';
import { Batch } from '../batch/batch.entity';
import { ProcessStatusModule } from '../processes/process-status/process-status.module';
import { SystemModule } from '../system/system.module';
import { Ocv1Record } from '../processes/ocv/ocv1-record.entity';
import { Ocv2Record } from '../processes/ocv/ocv2-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CellBarcode, Batch, Ocv1Record, Ocv2Record]),
    ProcessStatusModule,
    SystemModule,
  ],
  providers: [CellBarcodeService],
  controllers: [CellBarcodeController],
})
export class CellBarcodeModule {}