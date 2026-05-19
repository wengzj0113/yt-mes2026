import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WrappingRecord } from './wrapping-record.entity';
import { WrappingService } from './wrapping.service';
import { WrappingController } from './wrapping.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WrappingRecord, Batch, QualityCheck])],
  providers: [WrappingService],
  controllers: [WrappingController],
  exports: [WrappingService],
})
export class WrappingModule {}
