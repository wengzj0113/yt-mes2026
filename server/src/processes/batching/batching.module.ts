import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchingRecord } from './batching-record.entity';
import { BatchingService } from './batching.service';
import { BatchingController } from './batching.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BatchingRecord, Batch, QualityCheck])],
  providers: [BatchingService],
  controllers: [BatchingController],
  exports: [BatchingService],
})
export class BatchingModule {}
