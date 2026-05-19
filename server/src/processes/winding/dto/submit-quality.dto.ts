import { IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitWindingQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coreThickness: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coreDiameter: number;
}
