import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectrodeRecord } from './electrode-record.entity';
import { ElectrodeService } from './electrode.service';
import { ElectrodeController } from './electrode.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ElectrodeRecord, Batch, QualityCheck])],
  providers: [ElectrodeService],
  controllers: [ElectrodeController],
  exports: [ElectrodeService],
})
export class ElectrodeModule {}
