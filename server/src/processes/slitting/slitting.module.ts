import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlittingRecord } from './slitting-record.entity';
import { SlittingService } from './slitting.service';
import { SlittingController } from './slitting.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SlittingRecord, Batch, QualityCheck])],
  providers: [SlittingService],
  controllers: [SlittingController],
  exports: [SlittingService],
})
export class SlittingModule {}
