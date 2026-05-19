import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFormationDraftDto {
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
