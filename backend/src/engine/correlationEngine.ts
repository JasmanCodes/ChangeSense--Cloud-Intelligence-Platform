import { CORRELATION_WEIGHTS, RISK_WEIGHTS, TIME_WINDOWS } from './config.js';
import { AnomalyResult } from './anomalyDetector.js';

export interface ChangeRecord {
  id: string;
  serviceName: string;
  changeType: 'DEPLOYMENT' | 'CONFIG_CHANGE' | 'IAM_CHANGE' | 'SECURITY_GROUP_CHANGE' | 'DB_CHANGE' | 'SCALING' | 'VERSION_CHANGE';
  title: string;
  environment: 'PROD' | 'STAGING' | 'DEV';
  timestamp: Date;
  diff?: any;
  metadata?: any;
}

export interface CorrelationResult {
  changeId: string;
  changeTitle: string;
  serviceName: string;
  correlationScore: number; // 0 to 100
  isProbableCause: boolean;
  confidenceScore: number; // 0.0 to 1.0
  explanation: string;
  factors: {
    temporalProximityScore: number;
    serviceMatchScore: number;
    metricImpactScore: number;
    errorImpactScore: number;
  };
}

export interface RiskFactor {
  factor: string;
  score: number;
  weight: number;
  contribution: number;
  description: string;
}

export interface RiskEvaluationResult {
  overallScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdown: RiskFactor[];
}

/**
 * Calculates deterministic correlation score between a change event and an observed anomaly
 */
export function calculateCorrelation(
  change: ChangeRecord,
  anomaly: AnomalyResult,
  anomalyTimestamp: Date
): CorrelationResult {
  const changeTime = new Date(change.timestamp).getTime();
  const anomalyTime = new Date(anomalyTimestamp).getTime();
  const diffMinutes = (anomalyTime - changeTime) / (60 * 1000);

  // Causality rule: A change occurring AFTER the anomaly cannot have caused it
  if (diffMinutes < 0) {
    return {
      changeId: change.id,
      changeTitle: change.title,
      serviceName: change.serviceName,
      correlationScore: 0,
      isProbableCause: false,
      confidenceScore: 0,
      explanation: `Change "${change.title}" occurred after the observed anomaly and is excluded as a potential cause.`,
      factors: {
        temporalProximityScore: 0,
        serviceMatchScore: 0,
        metricImpactScore: 0,
        errorImpactScore: 0,
      },
    };
  }

  // 1. Temporal Proximity Score (0 - 100)
  // Anomaly should occur AFTER the change within the correlation window
  let proximityScore = 0;
  if (diffMinutes >= 0 && diffMinutes <= TIME_WINDOWS.CORRELATION_MAX_MINUTES) {
    if (diffMinutes <= TIME_WINDOWS.OPTIMAL_PROXIMITY_MINUTES) {
      // Very close: within 10 minutes gets 90-100
      proximityScore = 100 - (diffMinutes / TIME_WINDOWS.OPTIMAL_PROXIMITY_MINUTES) * 10;
    } else {
      // Decays linearly from 90 down to 20 at 60 minutes
      proximityScore = 90 - ((diffMinutes - 10) / 50) * 70;
    }
  }

  // 2. Service Match Score (0 - 100)
  let serviceMatchScore = 30; // base cross-service dependency score
  if (change.serviceName.toLowerCase() === anomaly.serviceName.toLowerCase()) {
    serviceMatchScore = 100; // direct match
  }

  // 3. Metric Impact Magnitude Score (0 - 100)
  let metricImpactScore = 50;
  if (anomaly.metricName === 'latency') {
    // 120ms baseline -> 850ms is massive
    metricImpactScore = Math.min(100, Math.max(30, (anomaly.currentValue / 800) * 100));
  } else if (anomaly.metricName === 'cpu') {
    metricImpactScore = Math.min(100, (anomaly.currentValue / 100) * 100);
  }

  // 4. Error Impact Score (0 - 100)
  let errorImpactScore = 40;
  if (anomaly.metricName === 'error_rate') {
    errorImpactScore = Math.min(100, Math.max(30, (anomaly.currentValue / 15) * 100));
  } else if (anomaly.severity === 'CRITICAL') {
    errorImpactScore = 95;
  }

  // Weighted Correlation Score
  const weightedScore = Math.round(
    proximityScore * CORRELATION_WEIGHTS.TEMPORAL_PROXIMITY +
    serviceMatchScore * CORRELATION_WEIGHTS.SERVICE_MATCH +
    metricImpactScore * CORRELATION_WEIGHTS.METRIC_IMPACT +
    errorImpactScore * CORRELATION_WEIGHTS.ERROR_IMPACT
  );

  const confidenceScore = Math.min(0.99, Math.max(0.1, weightedScore / 100));
  const isProbableCause = weightedScore >= 70;

  // Language constraint: Always say "probable" or "likely", NEVER "proven"
  const explanation = isProbableCause
    ? `Change "${change.title}" is the probable cause with ${(confidenceScore * 100).toFixed(0)}% confidence due to rapid temporal proximity (${diffMinutes.toFixed(1)}m prior) and direct impact on ${anomaly.serviceName}.`
    : `Change "${change.title}" has a weak correlation score (${weightedScore}/100) and is unlikely to be the primary cause.`;

  return {
    changeId: change.id,
    changeTitle: change.title,
    serviceName: change.serviceName,
    correlationScore: weightedScore,
    isProbableCause,
    confidenceScore,
    explanation,
    factors: {
      temporalProximityScore: Math.round(proximityScore),
      serviceMatchScore,
      metricImpactScore: Math.round(metricImpactScore),
      errorImpactScore: Math.round(errorImpactScore),
    },
  };
}

/**
 * Calculates multi-factor risk score (0-100) for a detected change event
 */
export function calculateRiskScore(params: {
  changeType: ChangeRecord['changeType'];
  environment: 'PROD' | 'STAGING' | 'DEV';
  latencyJumpMs?: { before: number; after: number };
  errorRateJumpPct?: { before: number; after: number };
  isOpenSecurityGroup?: boolean;
}): RiskEvaluationResult {
  const breakdown: RiskFactor[] = [];

  // Factor 1: Environment Weight
  let envScore = 5;
  let envDesc = 'Development workload';
  if (params.environment === 'PROD') {
    envScore = 35;
    envDesc = 'Direct deployment to active PROD workload';
  } else if (params.environment === 'STAGING') {
    envScore = 18;
    envDesc = 'Staging pre-production workload';
  }
  breakdown.push({
    factor: 'Production Environment',
    score: envScore,
    weight: RISK_WEIGHTS.ENVIRONMENT,
    contribution: envScore,
    description: envDesc,
  });

  // Factor 2: Latency Impact
  let latencyScore = 0;
  if (params.latencyJumpMs) {
    const jump = params.latencyJumpMs.after - params.latencyJumpMs.before;
    if (jump >= 500) {
      latencyScore = 30; // Massive jump like 120ms -> 850ms
    } else if (jump >= 200) {
      latencyScore = 20;
    } else if (jump > 50) {
      latencyScore = 10;
    }
  }
  breakdown.push({
    factor: 'Performance & Latency Impact',
    score: latencyScore,
    weight: RISK_WEIGHTS.PERFORMANCE_IMPACT,
    contribution: latencyScore,
    description: params.latencyJumpMs
      ? `Latency shifted from ${params.latencyJumpMs.before}ms to ${params.latencyJumpMs.after}ms`
      : 'No observed latency regression',
  });

  // Factor 3: Error Rate Impact
  let errorScore = 0;
  if (params.errorRateJumpPct) {
    const jump = params.errorRateJumpPct.after - params.errorRateJumpPct.before;
    if (jump >= 10.0) {
      errorScore = 22; // Massive surge like 0.8% -> 12.4%
    } else if (jump >= 4.0) {
      errorScore = 15;
    } else if (jump > 1.0) {
      errorScore = 8;
    }
  }
  breakdown.push({
    factor: 'Error Rate Surge',
    score: errorScore,
    weight: RISK_WEIGHTS.ERROR_IMPACT,
    contribution: errorScore,
    description: params.errorRateJumpPct
      ? `Error rate increased from ${params.errorRateJumpPct.before}% to ${params.errorRateJumpPct.after}%`
      : 'No observed error rate surge',
  });

  // Factor 4: Change Type or Security Risk
  if (params.isOpenSecurityGroup) {
    breakdown.push({
      factor: 'Zero-Trust Security Violation',
      score: 30,
      weight: 0.30,
      contribution: 30,
      description: 'Ingress port 22 open to 0.0.0.0/0',
    });
  }

  const rawSum = breakdown.reduce((acc, f) => acc + f.contribution, 0);
  const overallScore = Math.min(100, Math.max(0, rawSum));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (overallScore >= 61) riskLevel = 'HIGH';
  else if (overallScore >= 31) riskLevel = 'MEDIUM';

  return {
    overallScore,
    riskLevel,
    breakdown,
  };
}
