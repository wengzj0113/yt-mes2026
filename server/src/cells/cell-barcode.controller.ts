import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { CellBarcodeService } from './cell-barcode.service';
import { SorterUploadDto } from './dto/sorter-upload.dto';
import { BulkSorterUploadDto } from './dto/bulk-sorter-upload.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('cells')
export class CellBarcodeController {
  constructor(private readonly cellBarcodeService: CellBarcodeService) {}

  @Public()
  @Post('sorter-upload')
  async sorterUpload(@Body() dto: SorterUploadDto) {
    const record = await this.cellBarcodeService.sorterUpload(dto);
    return { data: record, message: '分选数据接收成功' };
  }

  @Public()
  @Post('sorter-upload/bulk')
  async bulkSorterUpload(@Body() dto: BulkSorterUploadDto) {
    const records = await this.cellBarcodeService.bulkSorterUpload(dto);
    return { data: records, message: '批量分选数据接收成功' };
  }

  @Get(':barcode/trace')
  async trace(@Param('barcode') barcode: string) {
    const cell = await this.cellBarcodeService.trace(barcode);
    return { data: cell };
  }

  @Get('batch/:batchNo/barcodes')
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
