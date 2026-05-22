import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProcessDictionaryService } from './process-dictionary.service';
import { ProcessDictionary } from './process-dictionary.entity';

@Controller('process-dictionary')
export class ProcessDictionaryController {
  constructor(private readonly processDictionaryService: ProcessDictionaryService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.processDictionaryService.findAll(query);
    return { success: true, data };
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const data = await this.processDictionaryService.findByCode(code);
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: Partial<ProcessDictionary>) {
    const data = await this.processDictionaryService.create(body);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<ProcessDictionary>) {
    const data = await this.processDictionaryService.update(+id, body);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.processDictionaryService.remove(+id);
    return { success: true, message: 'Deleted successfully' };
  }
}
