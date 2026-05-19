import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoatingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coatingSpeed: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coatingThicknessPos: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coatingThicknessNeg: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  arealDensityPos: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  arealDensityNeg: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coatingTemperature: number;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
