import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CellBarcodeService } from './cell-barcode.service';
import { SorterUploadDto } from './dto/sorter-upload.dto';
import { BulkSorterUploadDto } from './dto/bulk-sorter-upload.dto';
import { Ocv1UploadDto } from './dto/ocv1-upload.dto';
import { BulkOcv1UploadDto } from './dto/bulk-ocv1-upload.dto';
import { Ocv2UploadDto } from './dto/ocv2-upload.dto';
import { BulkOcv2UploadDto } from './dto/bulk-ocv2-upload.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { SorterApiLogInterceptor } from '../common/interceptors/sorter-api-log.interceptor';
import { ApiTypeDecorator } from '../common/decorators/api-type.decorator';

@Controller('cells')
export class CellBarcodeController {
  constructor(private readonly cellBarcodeService: CellBarcodeService) {}

  @Public()
  @ApiTypeDecorator('sorter')
  @UseInterceptors(SorterApiLogInterceptor)
  @Post('sorter-upload')
  async sorterUpload(@Body() dto: SorterUploadDto) {
    const record = await this.cellBarcodeService.sorterUpload(dto);
    return { data: record, message: '分选数据接收成功' };
  }

  @Public()
  @ApiTypeDecorator('sorter')
  @UseInterceptors(SorterApiLogInterceptor)
  @Post('sorter-upload/bulk')
  async bulkSorterUpload(@Body() dto: BulkSorterUploadDto) {
    const records = await this.cellBarcodeService.bulkSorterUpload(dto);
    return { data: records, message: '批量分选数据接收成功' };
  }

  // ============ OCV1 接口 ============
  @Public()
  @ApiTypeDecorator('ocv1')
  @UseInterceptors(SorterApiLogInterceptor)
  @Post('ocv1-upload')
  async ocv1Upload(@Body() dto: Ocv1UploadDto) {
    const records = await this.cellBarcodeService.ocv1Upload(dto);
    return { data: records[0], message: 'OCV1测试数据接收成功' };
  }

  @Public()
  @ApiTypeDecorator('ocv1')
  @UseInterceptors(SorterApiLogInterceptor)
  @Post('ocv1-upload/bulk')
  async bulkOcv1Upload(@Body() dto: BulkOcv1UploadDto) {
    const records = await this.cellBarcodeService.bulkOcv1Upload(dto);
    return { data: records, message: '批量OCV1测试数据接收成功' };
  }

  // ============ OCV2 接口 ============
  @Public()
  @ApiTypeDecorator('ocv2')
  @UseInterceptors(SorterApiLogInterceptor)
  @Post('ocv2-upload')
  async ocv2Upload(@Body() dto: Ocv2UploadDto) {
    const records = await this.cellBarcodeService.ocv2Upload(dto);
    return { data: records[0], message: 'OCV2测试数据接收成功' };
  }

  @Public()
  @ApiTypeDecorator('ocv2')
  @UseInterceptors(SorterApiLogInterceptor)
  @Post('ocv2-upload/bulk')
  async bulkOcv2Upload(@Body() dto: BulkOcv2UploadDto) {
    const records = await this.cellBarcodeService.bulkOcv2Upload(dto);
    return { data: records, message: '批量OCV2测试数据接收成功' };
  }

  @Get(':barcode/trace')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async trace(@Param('barcode') barcode: string) {
    const cell = await this.cellBarcodeService.trace(barcode);
    return { data: cell };
  }

  @Get('batch/:batchNo/barcodes')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async findByBatch(
    @Param('batchNo') batchNo: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    const result = await this.cellBarcodeService.findByBatch(batchNo, page, pageSize);
    return {
      data: result.data,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    };
  }
}
