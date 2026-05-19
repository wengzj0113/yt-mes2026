import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWindingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @IsString()
  @MaxLength(64)
  separatorModel: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  windingSpeed: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  windingTension: number;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
