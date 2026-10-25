import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { QUALITY_PAGES, type QualityPage } from '../types/quality.types';

export class QualityHistoryQueryDto {
  @IsString()
  metric!: string;

  @IsString()
  device!: string;

  @IsOptional()
  @IsIn(QUALITY_PAGES)
  page?: QualityPage;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;
}
