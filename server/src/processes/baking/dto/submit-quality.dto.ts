import { IsString, MaxLength, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitBakingQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  operatorName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vacuumLevel: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  moistureAfterBaking: number;
}
