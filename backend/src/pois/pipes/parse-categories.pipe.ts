import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  FEATURE_CATEGORY_IDS,
  type FeatureCategory,
} from '../contracts/feature-category';

@Injectable()
export class ParseCategoriesPipe implements PipeTransform<
  unknown,
  FeatureCategory[]
> {
  transform(value: unknown): FeatureCategory[] {
    if (value === undefined) {
      return [];
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        'categories must be a comma-separated string',
      );
    }

    const categories = value.split(',').map((category) => category.trim());

    if (
      categories.some(
        (category) =>
          !category ||
          !(FEATURE_CATEGORY_IDS as readonly string[]).includes(category),
      )
    ) {
      throw new BadRequestException(
        `Invalid categories. Allowed: ${FEATURE_CATEGORY_IDS.join(', ')}`,
      );
    }

    return [...new Set(categories)] as FeatureCategory[];
  }
}
