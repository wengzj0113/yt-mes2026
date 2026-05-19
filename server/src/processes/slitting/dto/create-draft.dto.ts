import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSlittingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  electrodeWidth: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  electrodeLength: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  slittingSpeed?: number;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
