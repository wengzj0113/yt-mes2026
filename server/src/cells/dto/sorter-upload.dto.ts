import { IsString, MaxLength, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SorterUploadDto {
  @IsString() @MaxLength(16) batchNo: string;
  @IsString() @MaxLength(32) barcode: string;
  
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  @MaxLength(32)
  capacity?: string;

  @IsOptional() @Type(() => Number) @IsNumber() voltage?: number;
  @IsOptional() @Type(() => Number) @IsNumber() internalResistance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() resistance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() kValue?: number;
  @IsOptional() @IsString() @MaxLength(16) grade?: string;
  @IsOptional() @IsDateString() sortingTime?: string;
}