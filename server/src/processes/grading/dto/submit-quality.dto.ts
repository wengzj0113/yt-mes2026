import { IsString, MaxLength, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitGradingQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  operatorName?: string;

  @IsString()
  @MaxLength(128)
  chargeDischargeTemplate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gradingTemperature: number;

  @IsString()
  @MaxLength(64)
  capacityGradeStandard: string;
}
