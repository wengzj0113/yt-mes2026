import { IsString, MaxLength, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class SorterUploadDto {
  @IsString() @MaxLength(16) batchNo: string;
  @IsString() @MaxLength(32) barcode: string;
  @IsOptional() @Type(() => Number) @IsNumber() capacity?: number;
  @IsOptional() @Type(() => Number) @IsNumber() voltage?: number;
  @IsOptional() @Type(() => Number) @IsNumber() internalResistance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() kValue?: number;
  @IsOptional() @IsString() @MaxLength(16) grade?: string;
  @IsOptional() @IsDateString() sortingTime?: string;
}