export type UserRole = 'ADMIN' | 'VIEWER';
export type Environment = 'PROD' | 'STAGING' | 'DEV';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
export type ChangeType =
  | 'DEPLOYMENT'
  | 'CONFIG_CHANGE'
  | 'IAM_CHANGE'
  | 'SECURITY_GROUP_CHANGE'
  | 'DB_CHANGE'
  | 'SCALING'
  | 'VERSION_CHANGE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  teamSize?: string;
  externalId: string;
}

export interface EnabledService {
  serviceKey: 'change-tracking' | 'incident-detection' | 'security-drift' | 'ai-assistant';
  enabled: boolean;
  enabledAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  environment: Environment;
  currentVersion?: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  latencyMs: number;
  errorRate: number;
  lastDeployment?: string;
  dependencies: string[];
}

export interface ChangeEvent {
  id: string;
  serviceId?: string;
  serviceName: string;
  changeType: ChangeType;
  title: string;
  description?: string;
  author: string;
  environment: Environment;
  timestamp: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  diff?: any;
  metadata?: any;
  linkedIncidentsCount?: number;
}

export interface IncidentItem {
  id: string;
  serviceName: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  probableCauseChange?: string;
  confidenceScore: number;
  explanation?: string;
  startedAt: string;
  resolvedAt?: string;
  affectedResources?: string[];
}

export interface SecurityFindingItem {
  id: string;
  title: string;
  ruleType: string;
  severity: Severity;
  resourceArn: string;
  resourceName: string;
  serviceName?: string;
  description: string;
  recommendedFix: string;
  isReviewed: boolean;
  timestamp: string;
  expectedConfig?: any;
  currentConfig?: any;
}

export interface MetricDataPoint {
  timestamp: string;
  latency: number;
  errorRate: number;
  cpu: number;
  hasChange?: boolean;
  changeDetails?: ChangeEvent;
}
