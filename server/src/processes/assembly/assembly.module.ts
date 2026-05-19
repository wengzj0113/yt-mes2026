import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssemblyRecord } from './assembly-record.entity';
import { AssemblyService } from './assembly.service';
import { AssemblyController } from './assembly.controller';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssemblyRecord, Batch, QualityCheck])],
  providers: [AssemblyService],
  controllers: [AssemblyController],
  exports: [AssemblyService],
})
export class AssemblyModule {}
