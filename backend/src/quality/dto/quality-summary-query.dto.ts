import { IsIn } from 'class-validator';

import {
  QUALITY_PAGES,
  QUALITY_DEVICES,
  type QualityPage,
  type QualityDevice,
} from '../types/quality.types';

export class QualitySummaryQueryDto {
  @IsIn(QUALITY_PAGES)
  page!: QualityPage;

  @IsIn(QUALITY_DEVICES)
  device!: QualityDevice;
}
