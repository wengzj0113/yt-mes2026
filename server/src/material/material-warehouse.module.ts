import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialWarehouse } from './material-warehouse.entity';
import { MaterialWarehouseService } from './material-warehouse.service';
import { MaterialWarehouseController } from './material-warehouse.controller';
import { Batch } from '../batch/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialWarehouse, Batch])],
  providers: [MaterialWarehouseService],
  controllers: [MaterialWarehouseController],
})
export class MaterialWarehouseModule {}
