import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SorterUploadDto } from './sorter-upload.dto';

export class BulkSorterUploadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SorterUploadDto)
  cells: SorterUploadDto[];
}