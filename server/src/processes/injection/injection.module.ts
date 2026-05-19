import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectionRecord } from './injection-record.entity';
import { InjectionService } from './injection.service';
import { InjectionController } from './injection.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InjectionRecord, Batch, QualityCheck])],
  providers: [InjectionService],
  controllers: [InjectionController],
  exports: [InjectionService],
})
export class InjectionModule {}
