import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MaterialWarehouseService } from './material-warehouse.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('batches/:batchNo/materials')
export class MaterialWarehouseController {
  constructor(private readonly materialWarehouseService: MaterialWarehouseService) {}

  @Post()
  async create(@Param('batchNo') batchNo: string, @Body() dto: CreateMaterialDto, @CurrentUser() user: JwtPayload) {
    dto.batchNo = batchNo;
    const record = await this.materialWarehouseService.create(dto, user.sub);
    return { data: record, message: '录入成功' };
  }

  @Get()
  async findAll(@Param('batchNo') batchNo: string) {
    const records = await this.materialWarehouseService.findAll(batchNo);
    return { data: records };
  }

  @Get('available')
  async findAvailable(@Param('batchNo') batchNo: string, @Query('type') type: string) {
    const records = await this.materialWarehouseService.findAvailable(batchNo, Number(type));
    return {
      data: records.map((item) => ({
        label: item.supplierBatchNo,
        value: item.supplierBatchNo,
        quantity: item.quantity,
        unit: item.unit,
      })),
    };
  }
}
