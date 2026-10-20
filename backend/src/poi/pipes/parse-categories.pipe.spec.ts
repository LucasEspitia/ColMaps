import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ParseCategoriesPipe } from './parse-categories.pipe';

describe('ParseCategoriesPipe', () => {
  const pipe = new ParseCategoriesPipe();

  it('should return no category filter when categories are omitted', () => {
    expect(pipe.transform(undefined)).toEqual([]);
  });

  it('should parse, trim and deduplicate categories while preserving order', () => {
    expect(
      pipe.transform(' museums_culture , attractions , museums_culture '),
    ).toEqual(['museums_culture', 'attractions']);
  });

  it.each([null, ['attractions'], 123])(
    'should reject a non-string value: %j',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );

  it.each(['', '   ', 'attractions,', 'attractions,unknown'])(
    'should reject empty or unknown categories: "%s"',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );
});
