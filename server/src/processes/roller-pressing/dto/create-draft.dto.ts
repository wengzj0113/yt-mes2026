import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRollerPressingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rollerPressure: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rollerThickness: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rollerSpeed?: number;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
