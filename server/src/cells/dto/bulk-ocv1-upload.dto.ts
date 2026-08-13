import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { Ocv1UploadDto } from './ocv1-upload.dto';

export class BulkOcv1UploadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Ocv1UploadDto)
  ocv1Records: Ocv1UploadDto[];
}