import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../batch/batch.entity';
import { ProcessParameterController } from './process-parameter.controller';
import { ProcessParameterService } from './process-parameter.service';
import { ProcessParameter } from './process-parameter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessParameter, Batch])],
  controllers: [ProcessParameterController],
  providers: [ProcessParameterService],
})
export class ProcessParameterModule {}
