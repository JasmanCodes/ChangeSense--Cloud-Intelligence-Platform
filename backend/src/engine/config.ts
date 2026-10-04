/**
 * Correlation and Risk Engine Configuration & Configurable Weights
 * All weights and threshold constants are centralized here.
 */

export const CORRELATION_WEIGHTS = {
  // Proximity: higher if the change occurred shortly before the anomaly
  TEMPORAL_PROXIMITY: 0.35,
  // Service match: higher if the change directly targets the degraded service
  SERVICE_MATCH: 0.30,
  // Metric magnitude: how severely latency/CPU spiked compared to baseline
  METRIC_IMPACT: 0.20,
  // Error rate jump: how much error rate jumped post-change
  ERROR_IMPACT: 0.15,
};

export const RISK_WEIGHTS = {
  ENVIRONMENT: 0.30,       // PROD = 30 pts, STAGING = 15 pts, DEV = 5 pts
  PERFORMANCE_IMPACT: 0.25, // p95 latency jump magnitude
  ERROR_IMPACT: 0.25,       // Error rate surge
  CHANGE_TYPE: 0.15,        // DEPLOYMENT / SECURITY_GROUP_CHANGE vs minor CONFIG
  HISTORICAL_FAILURE: 0.05, // Previous failure frequency on this service
};

export const ANOMALY_THRESHOLDS = {
  STATIC: {
    LATENCY_MS: 500.0,       // Latency > 500ms is static anomaly
    ERROR_RATE_PCT: 5.0,     // Error rate > 5% is static anomaly
    CPU_UTILIZATION_PCT: 90.0, // CPU > 90% is static anomaly
  },
  BASELINE: {
    STD_DEV_MULTIPLIER: 3.0, // > 3 standard deviations above rolling mean
    PERCENTAGE_JUMP: 2.0,    // 200% jump over baseline mean
  },
};

export const TIME_WINDOWS = {
  CORRELATION_MAX_MINUTES: 60, // Changes within 60 minutes prior to anomaly
  OPTIMAL_PROXIMITY_MINUTES: 10, // Changes within 10 minutes get maximum proximity score
  INCIDENT_MERGE_MINUTES: 15,    // Merge duplicate anomalies within 15 minutes
};
