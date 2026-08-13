import { IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveProcessParameterDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(64)
  equipmentCode: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  ocvVoltageMin: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  ocvVoltageMax: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  irMin: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  irMax: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  capacityMin: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  capacityMax: number;

  @IsString()
  @MaxLength(64)
  operatorName: string;
}
