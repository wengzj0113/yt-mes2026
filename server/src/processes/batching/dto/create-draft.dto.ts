import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBatchingDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(128)
  positiveMaterial: string;

  @IsString()
  @MaxLength(128)
  negativeMaterial: string;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
