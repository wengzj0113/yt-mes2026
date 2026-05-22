import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreatePackDto {
  @IsString()
  @IsNotEmpty()
  packBarcode: string;

  @IsString()
  @IsOptional()
  batchNo?: string;

  @IsString()
  @IsOptional()
  protectionBoardBarcode?: string;

  @IsArray()
  @IsString({ each: true })
  cellBarcodes: string[];
}
