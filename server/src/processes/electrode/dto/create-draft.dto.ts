import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateElectrodeDraftDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(64)
  tabMaterialSpec: string;

  @IsString()
  @MaxLength(64)
  electrodeLength: string;

  @IsString()
  @MaxLength(32)
  operatorName: string;
}
