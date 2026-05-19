import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class GenerateBatchNoDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Matches(/^[A-Z0-9]+$/)
  mnRatio?: string;
}
