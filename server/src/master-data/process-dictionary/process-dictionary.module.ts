import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessDictionary } from './process-dictionary.entity';
import { ProcessDictionaryController } from './process-dictionary.controller';
import { ProcessDictionaryService } from './process-dictionary.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessDictionary])],
  controllers: [ProcessDictionaryController],
  providers: [ProcessDictionaryService],
  exports: [ProcessDictionaryService],
})
export class ProcessDictionaryModule {}
