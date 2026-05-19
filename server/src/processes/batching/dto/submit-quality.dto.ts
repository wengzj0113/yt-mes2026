import { IsString, MaxLength } from 'class-validator';

export class SubmitBatchingQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(256)
  viscosityRecord: string;
}
