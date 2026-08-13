import { IsString, MaxLength, IsOptional } from 'class-validator';

export class SubmitBatchingQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  operatorName?: string;

  @IsString()
  @MaxLength(256)
  viscosityRecord: string;
}
