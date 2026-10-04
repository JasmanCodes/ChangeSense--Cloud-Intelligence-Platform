import { describe, it, expect } from 'vitest';
import {
  calculateCorrelation,
  calculateRiskScore,
  ChangeRecord,
} from '../src/engine/correlationEngine.js';
import { detectAnomaly } from '../src/engine/anomalyDetector.js';

describe('Correlation & Risk Engine Unit Tests (Payment Service v2.4 Flagship)', () => {
  const deployTime = new Date('2026-10-01T10:00:00Z');
  const anomalyTime = new Date('2026-10-01T10:02:30Z'); // 2.5 minutes later

  const paymentDeployChange: ChangeRecord = {
    id: 'chg-payment-v24',
    serviceName: 'payment-service',
    changeType: 'DEPLOYMENT',
    title: 'Deploy payment-service:v2.4 - DB connection pool reconfiguration',
    environment: 'PROD',
    timestamp: deployTime,
    diff: { pool_max: { old: 50, new: 5 } },
  };

  it('Accurately detects latency and error rate anomalies', () => {
    const latencyAnomaly = detectAnomaly(
      {
        serviceName: 'payment-service',
        metricName: 'latency',
        value: 850.0,
        timestamp: anomalyTime,
      },
      [115, 120, 118, 122, 119, 121, 120]
    );

    expect(latencyAnomaly.isAnomaly).toBe(true);
    expect(latencyAnomaly.severity).toBe('CRITICAL');
    expect(latencyAnomaly.currentValue).toBe(850.0);

    const errorAnomaly = detectAnomaly(
      {
        serviceName: 'payment-service',
        metricName: 'error_rate',
        value: 12.4,
        timestamp: anomalyTime,
      },
      [0.8, 0.7, 0.9, 0.8, 0.8]
    );

    expect(errorAnomaly.isAnomaly).toBe(true);
    expect(errorAnomaly.severity).toBe('CRITICAL');
  });

  it('Calculates HIGH risk score (~87) for Payment Service v2.4 deployment', () => {
    const risk = calculateRiskScore({
      changeType: 'DEPLOYMENT',
      environment: 'PROD',
      latencyJumpMs: { before: 120, after: 850 },
      errorRateJumpPct: { before: 0.8, after: 12.4 },
    });

    expect(risk.riskLevel).toBe('HIGH');
    // Verify score is ~87 as specified in Section 8
    expect(risk.overallScore).toBe(87);
    expect(risk.breakdown.length).toBe(3);

    // Assert factor contributions
    const envFactor = risk.breakdown.find((f) => f.factor === 'Production Environment');
    expect(envFactor?.contribution).toBe(35);

    const perfFactor = risk.breakdown.find((f) => f.factor === 'Performance & Latency Impact');
    expect(perfFactor?.contribution).toBe(30);

    const errFactor = risk.breakdown.find((f) => f.factor === 'Error Rate Surge');
    expect(errFactor?.contribution).toBe(22);
  });

  it('Calculates high correlation score and identifies change as "probable" cause', () => {
    const latencyAnomaly = detectAnomaly(
      {
        serviceName: 'payment-service',
        metricName: 'latency',
        value: 850.0,
        timestamp: anomalyTime,
      },
      [120, 120, 120, 120, 120]
    );

    const correlation = calculateCorrelation(paymentDeployChange, latencyAnomaly, anomalyTime);

    expect(correlation.correlationScore).toBeGreaterThanOrEqual(85);
    expect(correlation.isProbableCause).toBe(true);
    expect(correlation.confidenceScore).toBeGreaterThanOrEqual(0.85);

    // CRITICAL: Compliance with rule: "Always say 'probable' or 'likely' cause, never 'proven'"
    expect(correlation.explanation.toLowerCase()).toContain('probable cause');
    expect(correlation.explanation.toLowerCase()).not.toContain('proven');
  });

  it('Disregards unrelated changes occurring AFTER the anomaly', () => {
    const lateChange: ChangeRecord = {
      id: 'chg-late',
      serviceName: 'payment-service',
      changeType: 'CONFIG_CHANGE',
      title: 'Post-incident config change',
      environment: 'PROD',
      timestamp: new Date('2026-10-01T10:15:00Z'), // 15 mins after anomaly
    };

    const latencyAnomaly = detectAnomaly(
      {
        serviceName: 'payment-service',
        metricName: 'latency',
        value: 850.0,
        timestamp: anomalyTime,
      },
      [120, 120, 120, 120, 120]
    );

    const correlation = calculateCorrelation(lateChange, latencyAnomaly, anomalyTime);
    expect(correlation.correlationScore).toBeLessThan(40);
    expect(correlation.isProbableCause).toBe(false);
  });
});
