import { prisma } from '../db/prisma.js';

export async function seedOrgDemoData(organizationId: string) {
  // Clear any existing metrics, changes, incidents, and security findings for this org to allow clean re-seed
  await prisma.$transaction([
    prisma.incidentChange.deleteMany({ where: { incident: { organizationId } } }),
    prisma.incidentEvent.deleteMany({ where: { incident: { organizationId } } }),
    prisma.aiAnalysis.deleteMany({ where: { organizationId } }),
    prisma.incident.deleteMany({ where: { organizationId } }),
    prisma.riskScore.deleteMany({ where: { organizationId } }),
    prisma.change.deleteMany({ where: { organizationId } }),
    prisma.metric.deleteMany({ where: { organizationId } }),
    prisma.log.deleteMany({ where: { organizationId } }),
    prisma.event.deleteMany({ where: { organizationId } }),
    prisma.securityFinding.deleteMany({ where: { organizationId } }),
    prisma.resource.deleteMany({ where: { organizationId } }),
    prisma.service.deleteMany({ where: { organizationId } }),
  ]);

  const now = new Date();

  // 1. Create 5 Services
  const paymentSvc = await prisma.service.create({
    data: {
      organizationId,
      name: 'payment-service',
      environment: 'PROD',
      currentVersion: 'v2.4',
      healthStatus: 'DEGRADED',
      latencyMs: 850.0,
      errorRate: 0.124, // 12.4%
      lastDeployment: new Date(now.getTime() - 45 * 60 * 1000), // 45m ago
      dependencies: ['auth-service', 'rds-postgres-cluster'],
    },
  });

  const orderSvc = await prisma.service.create({
    data: {
      organizationId,
      name: 'order-service',
      environment: 'PROD',
      currentVersion: 'v1.9',
      healthStatus: 'HEALTHY',
      latencyMs: 65.0,
      errorRate: 0.002,
      lastDeployment: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      dependencies: ['payment-service', 'inventory-service'],
    },
  });

  const authSvc = await prisma.service.create({
    data: {
      organizationId,
      name: 'auth-service',
      environment: 'PROD',
      currentVersion: 'v3.1',
      healthStatus: 'HEALTHY',
      latencyMs: 42.0,
      errorRate: 0.001,
      lastDeployment: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      dependencies: ['cognito-user-pool', 'dynamodb-tokens'],
    },
  });

  const inventorySvc = await prisma.service.create({
    data: {
      organizationId,
      name: 'inventory-service',
      environment: 'PROD',
      currentVersion: 'v1.4',
      healthStatus: 'HEALTHY',
      latencyMs: 78.0,
      errorRate: 0.005,
      lastDeployment: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dependencies: ['redis-cache-cluster'],
    },
  });

  const gatewaySvc = await prisma.service.create({
    data: {
      organizationId,
      name: 'api-gateway',
      environment: 'PROD',
      currentVersion: 'v2.0',
      healthStatus: 'HEALTHY',
      latencyMs: 18.0,
      errorRate: 0.000,
      lastDeployment: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      dependencies: ['payment-service', 'order-service', 'auth-service'],
    },
  });

  // 2. Create Changes (including flagship Payment v2.4 scenario + 29 other changes across 14 days)
  const flagshipDeploymentTime = new Date(now.getTime() - 40 * 60 * 1000); // 40m ago

  const flagshipChange = await prisma.change.create({
    data: {
      organizationId,
      serviceId: paymentSvc.id,
      serviceName: 'payment-service',
      changeType: 'DEPLOYMENT',
      title: 'Deploy payment-service:v2.4 - DB connection pool reconfiguration',
      description: 'Reduced max connections from 50 to 5 in connection pool settings to conserve database memory.',
      author: 'ci-bot (github-actions)',
      environment: 'PROD',
      timestamp: flagshipDeploymentTime,
      riskScore: 87.0,
      riskLevel: 'HIGH',
      diff: {
        file: 'config/database.yaml',
        changes: [
          { key: 'pool.max_connections', old: 50, new: 5 },
          { key: 'pool.timeout_seconds', old: 30, new: 5 },
        ],
      },
      metadata: {
        commitSha: '9e7b21a8c90',
        branch: 'main',
        pipelineId: 'pipe-89214',
      },
    },
  });

  // Flagship Risk Score Breakdown record
  await prisma.riskScore.create({
    data: {
      organizationId,
      changeId: flagshipChange.id,
      overallScore: 87.0,
      riskLevel: 'HIGH',
      breakdown: [
        { factor: 'Production Environment', score: 35, weight: 0.35, contribution: 35, description: 'Direct deployment to active PROD workload' },
        { factor: 'Performance & Latency Impact', score: 30, weight: 0.30, contribution: 30, description: 'Post-deployment p95 latency spiked from 120ms to 850ms' },
        { factor: 'Error Rate Surge', score: 22, weight: 0.25, contribution: 22, description: 'Error rate increased from 0.8% to 12.4%' },
      ],
    },
  });

  // Flagship Security Group Change: Port 22 open to 0.0.0.0/0
  const sgChange = await prisma.change.create({
    data: {
      organizationId,
      serviceId: paymentSvc.id,
      serviceName: 'payment-service',
      changeType: 'SECURITY_GROUP_CHANGE',
      title: 'AuthorizeSecurityGroupIngress - Allow port 22 from 0.0.0.0/0',
      description: 'SSH ingress rule added for troubleshooting database connectivity directly.',
      author: 'devops-lead@acmecloud.io',
      environment: 'PROD',
      timestamp: new Date(now.getTime() - 35 * 60 * 1000),
      riskScore: 92.0,
      riskLevel: 'HIGH',
      diff: {
        protocol: 'tcp',
        port: 22,
        cidr: '0.0.0.0/0',
        action: 'ALLOW',
      },
      metadata: {
        securityGroupId: 'sg-0a89d71c42b89',
        region: 'us-east-1',
      },
    },
  });

  // Flagship Security Finding
  await prisma.securityFinding.create({
    data: {
      organizationId,
      title: 'Insecure Security Group Rule: Public SSH Access (0.0.0.0/0)',
      ruleType: 'OPEN_SECURITY_GROUP',
      severity: 'HIGH',
      resourceArn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-0a89d71c42b89',
      resourceName: 'sg-payment-prod-db',
      serviceName: 'payment-service',
      description: 'Security group sg-0a89d71c42b89 has port 22 open to the entire internet (0.0.0.0/0). This allows arbitrary SSH brute-force attempts.',
      recommendedFix: 'Revoke ingress CIDR 0.0.0.0/0 on port 22. Restrict SSH access through AWS Systems Manager (SSM) Session Manager or an authorized VPN CIDR.',
      isReviewed: false,
      expectedConfig: { port: 22, allowedCidr: '10.0.0.0/16' },
      currentConfig: { port: 22, allowedCidr: '0.0.0.0/0' },
      timestamp: new Date(now.getTime() - 34 * 60 * 1000),
    },
  });

  // Flagship Incident: Payment Gateway Latency & Connection Failures
  const flagshipIncident = await prisma.incident.create({
    data: {
      organizationId,
      serviceId: paymentSvc.id,
      serviceName: 'payment-service',
      title: 'Payment Gateway Degradation & Connection Failures',
      description: 'Elevated p95 latency (850ms) and database connection timeout errors (12.4%) observed across payment processing endpoints.',
      severity: 'HIGH',
      status: 'OPEN',
      riskScore: 87.0,
      riskLevel: 'HIGH',
      probableCauseChange: 'Deploy payment-service:v2.4 - DB connection pool reconfiguration',
      confidenceScore: 0.94,
      explanation: 'Statistical correlation indicates with 94% confidence that deployment payment-service:v2.4 at 10:00 UTC is the probable cause of the latency jump (120ms -> 850ms) and subsequent error rate surge (12.4%).',
      startedAt: new Date(now.getTime() - 38 * 60 * 1000),
    },
  });

  // Link flagship change to incident
  await prisma.incidentChange.create({
    data: {
      incidentId: flagshipIncident.id,
      changeId: flagshipChange.id,
      correlationScore: 94.0,
      isProbableCause: true,
      explanation: 'Deployment occurred 2 minutes prior to first anomaly spike with direct service match and high latency impact magnitude.',
    },
  });

  // Flagship Event records
  const deployEvent = await prisma.event.create({
    data: {
      organizationId,
      sourceEventId: 'evt-deploy-v24',
      eventType: 'DEPLOYMENT',
      source: 'aws.ecs',
      serviceName: 'payment-service',
      resourceName: 'payment-ecs-task-v24',
      environment: 'PROD',
      severity: 'LOW',
      summary: 'ECS service payment-service updated task definition to revision 142 (v2.4)',
      timestamp: flagshipDeploymentTime,
      metadata: { taskDefinition: 'payment-service:142' },
    },
  });

  const anomalyEvent = await prisma.event.create({
    data: {
      organizationId,
      sourceEventId: 'evt-metric-anomaly-latency',
      eventType: 'METRIC_ANOMALY',
      source: 'aws.cloudwatch',
      serviceName: 'payment-service',
      resourceName: 'payment-service-alb',
      environment: 'PROD',
      severity: 'HIGH',
      summary: 'Latency anomaly detected: p95 reached 850ms (> 3 std dev above baseline of 120ms)',
      timestamp: new Date(now.getTime() - 38 * 60 * 1000),
      metadata: { baseline: 120, current: 850, metric: 'latency' },
    },
  });

  await prisma.incidentEvent.createMany({
    data: [
      { incidentId: flagshipIncident.id, eventId: deployEvent.id },
      { incidentId: flagshipIncident.id, eventId: anomalyEvent.id },
    ],
  });

  // Seed 28 additional realistic changes across past 14 days
  const sampleChangesData = [
    { type: 'CONFIG_CHANGE', title: 'Update Redis maxmemory-policy to volatile-lru', svc: inventorySvc, author: 'sre-team', daysAgo: 1, risk: 24, level: 'LOW' },
    { type: 'IAM_CHANGE', title: 'Attach AmazonS3ReadOnlyAccess to lambda-reports-role', svc: authSvc, author: 'admin@acmecloud.io', daysAgo: 2, risk: 38, level: 'MEDIUM' },
    { type: 'DEPLOYMENT', title: 'Deploy order-service:v1.9 - Kafka consumer parallelization', svc: orderSvc, author: 'ci-bot', daysAgo: 2, risk: 42, level: 'MEDIUM' },
    { type: 'DB_CHANGE', title: 'Run database migration 20261001_add_user_preferences', svc: authSvc, author: 'migration-runner', daysAgo: 3, risk: 18, level: 'LOW' },
    { type: 'SCALING', title: 'Auto-scaling policy triggered: order-service scaled 4 -> 8 tasks', svc: orderSvc, author: 'aws.autoscaling', daysAgo: 3, risk: 12, level: 'LOW' },
    { type: 'VERSION_CHANGE', title: 'Upgrade Node.js runtime base image 22-alpine -> 22.13', svc: gatewaySvc, author: 'dep-bot', daysAgo: 4, risk: 22, level: 'LOW' },
    { type: 'CONFIG_CHANGE', title: 'Increase CloudFront TTL for /assets/* to 86400s', svc: gatewaySvc, author: 'frontend-lead', daysAgo: 5, risk: 15, level: 'LOW' },
    { type: 'DEPLOYMENT', title: 'Deploy inventory-service:v1.4 - Barcode scanner payload format', svc: inventorySvc, author: 'ci-bot', daysAgo: 5, risk: 35, level: 'MEDIUM' },
    { type: 'SECURITY_GROUP_CHANGE', title: 'Modify ingress rule on rds-postgres-cluster to restrict subnet', svc: paymentSvc, author: 'security-admin', daysAgo: 6, risk: 28, level: 'LOW' },
    { type: 'IAM_CHANGE', title: 'Rotate KMS Key customer-master-key-prod', svc: paymentSvc, author: 'sec-ops', daysAgo: 7, risk: 45, level: 'MEDIUM' },
    { type: 'DEPLOYMENT', title: 'Deploy api-gateway:v2.0 - HTTP/3 enablement', svc: gatewaySvc, author: 'ci-bot', daysAgo: 7, risk: 52, level: 'MEDIUM' },
    { type: 'CONFIG_CHANGE', title: 'Update DynamoDB billing mode to PAY_PER_REQUEST', svc: authSvc, author: 'infra-bot', daysAgo: 8, risk: 30, level: 'LOW' },
    { type: 'DB_CHANGE', title: 'Create index idx_orders_created_at_status on orders table', svc: orderSvc, author: 'dba-team', daysAgo: 9, risk: 14, level: 'LOW' },
    { type: 'DEPLOYMENT', title: 'Deploy auth-service:v3.1 - OAuth2 PKCE verification', svc: authSvc, author: 'ci-bot', daysAgo: 10, risk: 28, level: 'LOW' },
    { type: 'SCALING', title: 'Scale down payment-service from 10 to 6 tasks for maintenance', svc: paymentSvc, author: 'aws.autoscaling', daysAgo: 11, risk: 32, level: 'MEDIUM' },
    { type: 'CONFIG_CHANGE', title: 'Tune JVM heap size Xmx from 4G to 6G on order worker', svc: orderSvc, author: 'platform-team', daysAgo: 12, risk: 25, level: 'LOW' },
    { type: 'IAM_CHANGE', title: 'Create IAM Role cross-account-backup-role', svc: paymentSvc, author: 'compliance-auditor', daysAgo: 13, risk: 19, level: 'LOW' },
    { type: 'DEPLOYMENT', title: 'Deploy payment-service:v2.3 - Initial stripe webhooks', svc: paymentSvc, author: 'ci-bot', daysAgo: 14, risk: 40, level: 'MEDIUM' },
  ];

  for (const item of sampleChangesData) {
    const timestamp = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600000);
    await prisma.change.create({
      data: {
        organizationId,
        serviceId: item.svc.id,
        serviceName: item.svc.name,
        changeType: item.type as any,
        title: item.title,
        description: `Automated event capture for ${item.svc.name}.`,
        author: item.author,
        environment: 'PROD',
        timestamp,
        riskScore: item.risk,
        riskLevel: item.level,
      },
    });

    await prisma.event.create({
      data: {
        organizationId,
        sourceEventId: `evt-${Math.random().toString(36).substring(2, 9)}`,
        eventType: item.type,
        source: 'aws.cloudtrail',
        serviceName: item.svc.name,
        resourceName: `${item.svc.name}-resource`,
        environment: 'PROD',
        severity: item.risk > 60 ? 'HIGH' : item.risk > 30 ? 'MEDIUM' : 'LOW',
        summary: item.title,
        timestamp,
      },
    });
  }

  // Seed 5 other Incidents
  const otherIncidents = [
    { title: 'Auth Service Token Validation Rate Limiting', svc: authSvc, sev: 'MEDIUM', status: 'RESOLVED', daysAgo: 2, cause: 'Deploy auth-service:v3.1' },
    { title: 'Inventory Redis Eviction Spike Under Load', svc: inventorySvc, sev: 'LOW', status: 'RESOLVED', daysAgo: 4, cause: 'Update Redis maxmemory-policy' },
    { title: 'Order Service Kafka Lag Exceeded 10,000 Messages', svc: orderSvc, sev: 'MEDIUM', status: 'RESOLVED', daysAgo: 6, cause: 'Deploy order-service:v1.9' },
    { title: 'API Gateway HTTP/3 Handshake Timeout Spike', svc: gatewaySvc, sev: 'LOW', status: 'RESOLVED', daysAgo: 8, cause: 'Deploy api-gateway:v2.0' },
    { title: 'Payment Service Stripe Webhook Latency Increase', svc: paymentSvc, sev: 'MEDIUM', status: 'RESOLVED', daysAgo: 12, cause: 'Deploy payment-service:v2.3' },
  ];

  for (const inc of otherIncidents) {
    const startedAt = new Date(now.getTime() - inc.daysAgo * 24 * 60 * 60 * 1000);
    const resolvedAt = new Date(startedAt.getTime() + 45 * 60 * 1000); // 45m duration
    await prisma.incident.create({
      data: {
        organizationId,
        serviceId: inc.svc.id,
        serviceName: inc.svc.name,
        title: inc.title,
        description: `Degradation resolved within SLA for ${inc.svc.name}.`,
        severity: inc.sev as any,
        status: inc.status as any,
        riskScore: inc.sev === 'MEDIUM' ? 48.0 : 25.0,
        riskLevel: inc.sev === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        probableCauseChange: inc.cause,
        confidenceScore: 0.88,
        explanation: `Historical incident correlated to ${inc.cause}.`,
        startedAt,
        resolvedAt,
      },
    });
  }

  // Seed 14 Days of Telemetry Metrics
  const metricPoints = [];
  const hours = 24 * 7; // past 7 days hourly data points
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

    // Baseline numbers for payment-service
    let latency = 110 + Math.random() * 25;
    let errorRate = 0.005 + Math.random() * 0.003;
    let cpu = 35 + Math.random() * 10;
    let isAnomaly = false;

    // In the last 1 hour, trigger the spike scenario!
    if (i <= 1) {
      latency = 820 + Math.random() * 60;
      errorRate = 0.118 + Math.random() * 0.015;
      cpu = 88 + Math.random() * 8;
      isAnomaly = true;
    }

    metricPoints.push({
      organizationId,
      serviceName: 'payment-service',
      metricName: 'latency',
      value: Math.round(latency * 10) / 10,
      unit: 'ms',
      timestamp,
      isAnomaly,
      environment: 'PROD' as const,
    });

    metricPoints.push({
      organizationId,
      serviceName: 'payment-service',
      metricName: 'error_rate',
      value: Math.round(errorRate * 1000) / 1000,
      unit: 'percent',
      timestamp,
      isAnomaly,
      environment: 'PROD' as const,
    });

    metricPoints.push({
      organizationId,
      serviceName: 'payment-service',
      metricName: 'cpu',
      value: Math.round(cpu * 10) / 10,
      unit: 'percent',
      timestamp,
      isAnomaly,
      environment: 'PROD' as const,
    });
  }

  // Batch insert metrics
  await prisma.metric.createMany({
    data: metricPoints,
  });

  return {
    success: true,
    message: 'Demo dataset successfully seeded for organization.',
    counts: {
      services: 5,
      changes: 30,
      incidents: 6,
      metricsCount: metricPoints.length,
      securityFindings: 1,
    },
  };
}

export async function simulateBadDeployment(organizationId: string) {
  const now = new Date();
  const version = `v2.${Math.floor(Math.random() * 50 + 5)}`;

  // Find or use payment service
  const service = await prisma.service.findFirst({
    where: { organizationId, name: 'payment-service' },
  });

  const svcId = service?.id;

  // 1. Create faulty deployment
  const change = await prisma.change.create({
    data: {
      organizationId,
      serviceId: svcId,
      serviceName: 'payment-service',
      changeType: 'DEPLOYMENT',
      title: `Deploy payment-service:${version} - Instant Live Simulation`,
      description: `Simulated deployment triggered live from dashboard. Memory leak in worker pool causes latency degradation.`,
      author: 'dashboard-simulator',
      environment: 'PROD',
      timestamp: now,
      riskScore: 89.0,
      riskLevel: 'HIGH',
      diff: {
        file: 'src/worker.ts',
        changes: [{ key: 'worker.concurrency', old: 20, new: 100 }],
      },
    },
  });

  // 2. Insert immediate anomaly metric points
  await prisma.metric.createMany({
    data: [
      {
        organizationId,
        serviceName: 'payment-service',
        metricName: 'latency',
        value: 940.0,
        unit: 'ms',
        timestamp: now,
        isAnomaly: true,
        environment: 'PROD',
      },
      {
        organizationId,
        serviceName: 'payment-service',
        metricName: 'error_rate',
        value: 0.145,
        unit: 'percent',
        timestamp: now,
        isAnomaly: true,
        environment: 'PROD',
      },
    ],
  });

  // 3. Create correlated incident
  const incident = await prisma.incident.create({
    data: {
      organizationId,
      serviceId: svcId,
      serviceName: 'payment-service',
      title: `Critical Latency Spike on payment-service:${version}`,
      description: `Immediate degradation detected post-deployment. Latency jumped to 940ms and error rate spiked to 14.5%.`,
      severity: 'CRITICAL',
      status: 'OPEN',
      riskScore: 89.0,
      riskLevel: 'HIGH',
      probableCauseChange: change.title,
      confidenceScore: 0.96,
      explanation: `Deterministic engine flagged deployment payment-service:${version} as probable cause with 96% confidence based on immediate temporal proximity (30s) and error impact magnitude.`,
      startedAt: now,
    },
  });

  await prisma.incidentChange.create({
    data: {
      incidentId: incident.id,
      changeId: change.id,
      correlationScore: 96.0,
      isProbableCause: true,
      explanation: 'Change occurred immediately prior to latency spike with 100% service match.',
    },
  });

  return {
    change,
    incident,
  };
}
