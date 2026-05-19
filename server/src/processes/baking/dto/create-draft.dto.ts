import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBakingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bakingTemperature: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bakingDuration: number;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
