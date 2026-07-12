/** Header name for CI-only rate-limit bypass (value must match server QA_THROTTLE_BYPASS_TOKEN). */
export const QA_THROTTLE_BYPASS_HEADER = 'x-qa-throttle-bypass';

/** Minimum secret length — shorter values are ignored (bypass disabled). */
export const QA_THROTTLE_BYPASS_MIN_LENGTH = 32;
