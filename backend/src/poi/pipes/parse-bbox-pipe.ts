import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Bbox } from '../types/bbox.type';

@Injectable()
export class ParseBboxPipe implements PipeTransform<string | undefined, Bbox> {
  transform(value: string | undefined): Bbox {
    if (typeof value !== 'string') {
      throw new BadRequestException('bbox must contain west,south,east,north');
    }

    const parts = value.split(',').map((part) => part.trim());

    if (parts.length !== 4 || parts.some((part) => !part)) {
      throw new BadRequestException('bbox must contain west,south,east,north');
    }

    const [west, south, east, north] = parts.map(Number);

    if (![west, south, east, north].every(Number.isFinite)) {
      throw new BadRequestException('Invalid bbox coordinates');
    }

    if (
      west < -180 ||
      west > 180 ||
      east < -180 ||
      east > 180 ||
      south < -90 ||
      south > 90 ||
      north < -90 ||
      north > 90 ||
      west >= east ||
      south >= north
    ) {
      throw new BadRequestException('Invalid bounding box');
    }

    return [west, south, east, north];
  }
}
