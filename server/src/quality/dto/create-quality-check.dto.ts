import { IsString, IsOptional, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQualityCheckDto {
  @IsOptional() @IsString() @MaxLength(16) batchNo?: string;
  @IsString() @MaxLength(32) processType: string;
  @Type(() => Number) @IsNumber() @Min(1) @Max(2) inspectionResult: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) defectQty?: number;
  @IsOptional() @IsString() @MaxLength(512) defectReason?: string;
  @IsString() @MaxLength(32) inspectorName: string;
  @IsOptional() @IsString() @MaxLength(512) abnormalRecord?: string;
}
