export const QUALITY_SOURCES = [
  'lighthouse',
  'playwright',
  'build',
  'mobile',
] as const;

export type QualitySource = (typeof QUALITY_SOURCES)[number];

export const QUALITY_STATUSES = [
  'pending',
  'running',
  'passed',
  'failed',
  'error',
] as const;

export type QualityStatus = (typeof QUALITY_STATUSES)[number];

export const QUALITY_ENVIRONMENTS = [
  'development',
  'staging',
  'production',
] as const;

export type QualityEnvironment = (typeof QUALITY_ENVIRONMENTS)[number];
