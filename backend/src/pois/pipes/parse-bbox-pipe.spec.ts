import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ParseBboxPipe } from './parse-bbox-pipe';

describe('ParseBboxPipe', () => {
  const pipe = new ParseBboxPipe();

  it('should parse valid bbox coordinates', () => {
    expect(pipe.transform('-74.2,4.5,-73.9,4.8')).toEqual([
      -74.2, 4.5, -73.9, 4.8,
    ]);
  });

  it('should trim whitespace around coordinates', () => {
    expect(pipe.transform(' -74.2 , 4.5 , -73.9 , 4.8 ')).toEqual([
      -74.2, 4.5, -73.9, 4.8,
    ]);
  });

  it('should reject a missing bbox', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });

  it.each(['', '-74.2,4.5,-73.9', '-74.2,4.5,-73.9,4.8,5', '-74.2,,,-73.9'])(
    'should reject malformed bbox: "%s"',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );

  it.each([
    '-74.2,abc,-73.9,4.8',
    '-74.2,NaN,-73.9,4.8',
    '-74.2,Infinity,-73.9,4.8',
  ])('should reject non-finite coordinates: "%s"', (value) => {
    expect(() => pipe.transform(value)).toThrow('Invalid bbox coordinates');
  });

  it.each(['-181,0,10,10', '-10,0,181,10', '-10,-91,10,10', '-10,0,10,91'])(
    'should reject out-of-range coordinates: "%s"',
    (value) => {
      expect(() => pipe.transform(value)).toThrow('Invalid bounding box');
    },
  );

  it.each(['-10,0,-10,10', '10,0,-10,10', '-10,5,10,5', '-10,10,10,0'])(
    'should reject inverted or zero-area bbox: "%s"',
    (value) => {
      expect(() => pipe.transform(value)).toThrow('Invalid bounding box');
    },
  );
});
