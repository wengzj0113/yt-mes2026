import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemLog } from './entities/log.entity';
import { SystemConfig } from './entities/config.entity';
import { SorterApiLog } from './entities/sorter-api-log.entity';
import { SystemRole } from './entities/role.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemLog, SystemConfig, SorterApiLog, SystemRole, User])],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
