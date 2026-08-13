import { IsString, IsNumber, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitElectrodeQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  operatorName?: string;

  @Type(() => Number)
  @IsNumber()
  tabWeldingPull: number;
}
