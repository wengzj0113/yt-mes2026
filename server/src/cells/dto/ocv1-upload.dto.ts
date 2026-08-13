import { IsString, MaxLength, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class Ocv1UploadDto {
  @IsString() @MaxLength(16) batchNo: string;
  @IsString() @MaxLength(32) barcode: string;
  @IsOptional() @Type(() => Number) @IsNumber() voltage?: number;
  @IsOptional() @Type(() => Number) @IsNumber() internalResistance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() resistance?: number;
  @IsOptional() @IsDateString() testTime?: string;
  @IsOptional() @IsString() @MaxLength(64) equipmentCode?: string;
}