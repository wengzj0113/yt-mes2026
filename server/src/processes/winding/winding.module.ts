import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WindingRecord } from './winding-record.entity';
import { WindingService } from './winding.service';
import { WindingController } from './winding.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WindingRecord, Batch, QualityCheck])],
  providers: [WindingService],
  controllers: [WindingController],
  exports: [WindingService],
})
export class WindingModule {}
