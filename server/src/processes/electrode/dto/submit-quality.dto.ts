import { IsString, MaxLength } from 'class-validator';

export class SubmitElectrodeQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @IsString()
  @MaxLength(256)
  tabWeldingPull: string;
}
