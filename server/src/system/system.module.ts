import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemLog } from './entities/log.entity';
import { SystemConfig } from './entities/config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemLog, SystemConfig])],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
