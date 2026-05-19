import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationRecord } from './formation-record.entity';
import { FormationService } from './formation.service';
import { FormationController } from './formation.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FormationRecord, Batch, QualityCheck])],
  providers: [FormationService],
  controllers: [FormationController],
  exports: [FormationService],
})
export class FormationModule {}
