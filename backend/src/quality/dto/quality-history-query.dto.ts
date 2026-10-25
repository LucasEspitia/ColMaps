import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class QualityHistoryQueryDto {
  @IsString()
  metric!: string;

  @IsString()
  device!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  pageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;
}
