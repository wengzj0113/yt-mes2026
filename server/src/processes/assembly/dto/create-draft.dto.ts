import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateAssemblyDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(32)
  casingEquipmentCode: string;

  @IsString()
  @MaxLength(64)
  shellModel: string;

  @IsString()
  @MaxLength(32)
  bottomWeldEquipment: string;

  @IsString()
  @MaxLength(128)
  bottomWeldParams: string;

  @IsString()
  @MaxLength(64)
  capModel: string;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
