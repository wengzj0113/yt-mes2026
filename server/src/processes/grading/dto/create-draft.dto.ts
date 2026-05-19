import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateGradingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
