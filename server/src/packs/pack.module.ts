import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pack } from './pack.entity';
import { PackCell } from './pack-cell.entity';
import { PackService } from './pack.service';
import { PackController } from './pack.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pack, PackCell])],
  providers: [PackService],
  controllers: [PackController],
  exports: [PackService],
})
export class PackModule {}
