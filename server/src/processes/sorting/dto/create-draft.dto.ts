import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSortingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  equipmentCode: string;

  @IsString()
  @MaxLength(64)
  ocvVoltageRange: string;

  @IsString()
  @MaxLength(64)
  irRange: string;

  @IsString()
  @MaxLength(64)
  capacityRange: string;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
