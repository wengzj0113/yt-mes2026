import { IsString, MaxLength, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAssemblyQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  // ---- 草稿字段（提交时可选，由前端从 draftForm 携带） ----
  @IsOptional()
  @IsString()
  @MaxLength(32)
  casingEquipmentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  shellModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  bottomWeldEquipment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  bottomWeldParams?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  capModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  operatorName?: string;

  // ---- 质检字段 ----
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bottomWeldPull: number;

  @IsString()
  @MaxLength(256)
  grooveRecord: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capWeldingPull: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tabWeldingPull: number;
}
