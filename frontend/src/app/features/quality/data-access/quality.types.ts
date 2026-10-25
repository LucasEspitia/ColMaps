// Quality pipeline sources
export const QUALITY_SOURCES = ['lighthouse', 'playwright', 'build', 'mobile'] as const;

export type QualitySource = (typeof QUALITY_SOURCES)[number];

// Quality execution statuses
export const QUALITY_STATUSES = ['pending', 'running', 'passed', 'failed', 'error'] as const;

export type QualityStatus = (typeof QUALITY_STATUSES)[number];

// Deployment environments
export const QUALITY_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export type QualityEnvironment = (typeof QUALITY_ENVIRONMENTS)[number];

// API contracts
export interface QualityResult {
  id: string;
  metric: string;
  value: number;
  unit: string;
  target?: string | null;
  device: string;
  pageUrl?: string | null;
  details?: Record<string, unknown> | null;
}

export interface QualityRun {
  id: string;
  source: QualitySource;
  status: QualityStatus;
  environment: QualityEnvironment;
  commitSha?: string | null;
  branch?: string | null;
  artifactUrl?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  results?: QualityResult[];
}

export interface QualitySummary {
  totalRuns: number;
  latestRun: QualityRun | null;
  metrics: QualityResult[];
}

export interface QualityRunsResponse {
  data: QualityRun[];
  total: number;
  page: number;
  limit: number;
}
