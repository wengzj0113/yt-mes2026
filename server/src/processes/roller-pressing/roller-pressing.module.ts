import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RollerPressingRecord } from './roller-pressing-record.entity';
import { RollerPressingService } from './roller-pressing.service';
import { RollerPressingController } from './roller-pressing.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RollerPressingRecord, Batch, QualityCheck])],
  providers: [RollerPressingService],
  controllers: [RollerPressingController],
  exports: [RollerPressingService],
})
export class RollerPressingModule {}
