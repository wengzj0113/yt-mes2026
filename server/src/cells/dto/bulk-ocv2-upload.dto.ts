import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { Ocv2UploadDto } from './ocv2-upload.dto';

export class BulkOcv2UploadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Ocv2UploadDto)
  ocv2Records: Ocv2UploadDto[];
}