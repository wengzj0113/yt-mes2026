import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWrappingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @IsString()
  @MaxLength(64)
  filmModel: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shrinkTemperature: number;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
