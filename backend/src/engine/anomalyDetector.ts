import { ANOMALY_THRESHOLDS } from './config.js';

export interface MetricSample {
  serviceName: string;
  metricName: 'latency' | 'error_rate' | 'cpu';
  value: number;
  timestamp: Date;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  metricName: string;
  serviceName: string;
  currentValue: number;
  baselineMean: number;
  deviationMultiplier: number;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function detectAnomaly(
  sample: MetricSample,
  baselineHistory: number[]
): AnomalyResult {
  const { metricName, serviceName, value } = sample;

  // 1. Check static thresholds
  if (metricName === 'latency' && value >= ANOMALY_THRESHOLDS.STATIC.LATENCY_MS) {
    const isCritical = value >= 800;
    return {
      isAnomaly: true,
      metricName,
      serviceName,
      currentValue: value,
      baselineMean: 120,
      deviationMultiplier: value / 120,
      reason: `Latency reached ${value}ms exceeding static threshold (${ANOMALY_THRESHOLDS.STATIC.LATENCY_MS}ms)`,
      severity: isCritical ? 'CRITICAL' : 'HIGH',
    };
  }

  if (metricName === 'error_rate' && value >= ANOMALY_THRESHOLDS.STATIC.ERROR_RATE_PCT) {
    const isCritical = value >= 10.0;
    return {
      isAnomaly: true,
      metricName,
      serviceName,
      currentValue: value,
      baselineMean: 0.8,
      deviationMultiplier: value / 0.8,
      reason: `Error rate surged to ${value}% exceeding static threshold (${ANOMALY_THRESHOLDS.STATIC.ERROR_RATE_PCT}%)`,
      severity: isCritical ? 'CRITICAL' : 'HIGH',
    };
  }

  // 2. Statistical rolling baseline evaluation
  if (baselineHistory && baselineHistory.length >= 5) {
    const sum = baselineHistory.reduce((a, b) => a + b, 0);
    const mean = sum / baselineHistory.length;
    const variance =
      baselineHistory.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
      baselineHistory.length;
    const stdDev = Math.sqrt(variance) || 1;

    const zScore = (value - mean) / stdDev;

    if (zScore >= ANOMALY_THRESHOLDS.BASELINE.STD_DEV_MULTIPLIER) {
      return {
        isAnomaly: true,
        metricName,
        serviceName,
        currentValue: value,
        baselineMean: Math.round(mean * 10) / 10,
        deviationMultiplier: Math.round(zScore * 10) / 10,
        reason: `Value (${value}) is ${zScore.toFixed(1)} standard deviations above rolling baseline mean (${mean.toFixed(1)})`,
        severity: zScore > 5 ? 'HIGH' : 'MEDIUM',
      };
    }
  }

  return {
    isAnomaly: false,
    metricName,
    serviceName,
    currentValue: value,
    baselineMean: 0,
    deviationMultiplier: 0,
    reason: 'Metric within acceptable baseline',
    severity: 'LOW',
  };
}
