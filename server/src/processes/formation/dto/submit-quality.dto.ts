import { IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitFormationQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(128)
  chargeDischargeTemplate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  formationTemperature: number;
}
