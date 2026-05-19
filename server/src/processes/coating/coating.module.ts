import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoatingRecord } from './coating-record.entity';
import { CoatingService } from './coating.service';
import { CoatingController } from './coating.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoatingRecord, Batch, QualityCheck])],
  providers: [CoatingService],
  controllers: [CoatingController],
  exports: [CoatingService],
})
export class CoatingModule {}
