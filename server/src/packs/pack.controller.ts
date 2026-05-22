import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PackService } from './pack.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('packs')
@UseGuards(JwtAuthGuard)
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.packService.findAll(parseInt(page), parseInt(pageSize));
  }

  @Post()
  async createOrUpdate(@Body() dto: CreatePackDto, @Request() req: any) {
    const operatorName = req.user?.username || 'unknown';
    return this.packService.createOrUpdate(dto, operatorName);
  }

  @Get(':barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.packService.findByBarcode(barcode);
  }
}
