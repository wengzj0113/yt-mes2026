import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../batch/batch.entity';
import { ProcessDynamicController } from './process-dynamic.controller';
import { ProcessDynamicRecord } from './process-dynamic-record.entity';
import { ProcessDynamicService } from './process-dynamic.service';
@Module({ imports: [TypeOrmModule.forFeature([ProcessDynamicRecord, Batch])], controllers: [ProcessDynamicController], providers: [ProcessDynamicService] })
export class ProcessDynamicModule {}
