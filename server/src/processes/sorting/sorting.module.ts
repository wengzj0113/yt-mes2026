import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SortingRecord } from './sorting-record.entity';
import { SortingService } from './sorting.service';
import { SortingController } from './sorting.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SortingRecord, Batch, QualityCheck])],
  providers: [SortingService],
  controllers: [SortingController],
  exports: [SortingService],
})
export class SortingModule {}
