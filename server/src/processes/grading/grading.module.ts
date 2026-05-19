import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradingRecord } from './grading-record.entity';
import { GradingService } from './grading.service';
import { GradingController } from './grading.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GradingRecord, Batch, QualityCheck])],
  providers: [GradingService],
  controllers: [GradingController],
  exports: [GradingService],
})
export class GradingModule {}
