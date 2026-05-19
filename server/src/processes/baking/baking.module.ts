import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BakingRecord } from './baking-record.entity';
import { BakingService } from './baking.service';
import { BakingController } from './baking.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BakingRecord, Batch, QualityCheck])],
  providers: [BakingService],
  controllers: [BakingController],
  exports: [BakingService],
})
export class BakingModule {}
