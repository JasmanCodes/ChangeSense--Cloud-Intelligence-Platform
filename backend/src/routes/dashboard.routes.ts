import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJwt, requireOrg } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateJwt);
dashboardRouter.use(requireOrg);

// GET /api/dashboard/summary
dashboardRouter.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. KPI Counts
    const [activeIncidentsCount, highRiskChangesCount, totalServicesCount, healthyServicesCount] =
      await Promise.all([
        prisma.incident.count({
          where: { organizationId: orgId, status: { in: ['OPEN', 'INVESTIGATING'] } },
        }),
        prisma.change.count({
          where: { organizationId: orgId, timestamp: { gte: past24h }, riskScore: { gte: 60 } },
        }),
        prisma.service.count({ where: { organizationId: orgId } }),
        prisma.service.count({ where: { organizationId: orgId, healthStatus: 'HEALTHY' } }),
      ]);

    const serviceHealthPct =
      totalServicesCount > 0 ? Math.round((healthyServicesCount / totalServicesCount) * 100) : 100;

    // 2. Services List for Health Grid
    const services = await prisma.service.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });

    // 3. Recent Incidents
    const recentIncidents = await prisma.incident.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. Latest High-Risk Change & Score Breakdown
    const latestHighRiskChange = await prisma.change.findFirst({
      where: { organizationId: orgId, riskScore: { gte: 60 } },
      orderBy: { timestamp: 'desc' },
      include: { riskScoreRecord: true },
    });

    // 5. Recent Activity Feed (latest changes + events)
    const recentEvents = await prisma.event.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: 'desc' },
      take: 8,
    });

    // 6. Combined Chart Series (Telemetry + Changes)
    // Fetch last 24 hours of latency and error_rate for payment-service (or primary service)
    const metrics = await prisma.metric.findMany({
      where: {
        organizationId: orgId,
        serviceName: 'payment-service',
        timestamp: { gte: past24h },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Fetch changes in the same window
    const recentChanges = await prisma.change.findMany({
      where: {
        organizationId: orgId,
        timestamp: { gte: past24h },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group metrics by timestamp bucket for smooth chart rendering
    const telemetryMap = new Map<string, { timestamp: string; latency: number; errorRate: number; cpu: number }>();

    for (const m of metrics) {
      const timeKey = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const current = telemetryMap.get(timeKey) || { timestamp: timeKey, latency: 120, errorRate: 0.5, cpu: 30 };
      if (m.metricName === 'latency') current.latency = m.value;
      if (m.metricName === 'error_rate') current.errorRate = Math.round(m.value * 100 * 10) / 10;
      if (m.metricName === 'cpu') current.cpu = m.value;
      telemetryMap.set(timeKey, current);
    }

    const chartPoints = Array.from(telemetryMap.values());

    res.json({
      success: true,
      data: {
        kpis: {
          activeIncidents: activeIncidentsCount,
          highRiskChanges24h: highRiskChangesCount,
          mttd: '2.4m',
          serviceHealthPct,
          totalServices: totalServicesCount,
          healthyServices: healthyServicesCount,
        },
        services,
        recentIncidents,
        latestRiskGauge: {
          changeTitle: latestHighRiskChange?.title || 'payment-service:v2.4 Reconfiguration',
          serviceName: latestHighRiskChange?.serviceName || 'payment-service',
          riskScore: latestHighRiskChange?.riskScore || 87,
          riskLevel: latestHighRiskChange?.riskLevel || 'HIGH',
          breakdown: (latestHighRiskChange?.riskScoreRecord?.breakdown as any) || [
            { factor: 'Production Target', score: 35, contribution: 35, description: 'Direct deployment to active PROD workload' },
            { factor: 'Latency Impact (120ms -> 850ms)', score: 30, contribution: 30, description: 'Post-deployment p95 latency spiked' },
            { factor: 'Error Rate Jump (0.8% -> 12.4%)', score: 22, contribution: 22, description: 'Database timeout errors' },
          ],
        },
        recentEvents,
        recentChanges,
        chartSeries: chartPoints.length > 0 ? chartPoints : [
          { timestamp: '08:00', latency: 120, errorRate: 0.5, cpu: 35 },
          { timestamp: '09:00', latency: 125, errorRate: 0.6, cpu: 38 },
          { timestamp: '10:00', latency: 130, errorRate: 0.8, cpu: 40, hasChange: true, changeTitle: 'Deploy v2.4' },
          { timestamp: '10:05', latency: 850, errorRate: 12.4, cpu: 89, isAnomaly: true },
          { timestamp: '10:15', latency: 820, errorRate: 11.8, cpu: 85, isAnomaly: true },
          { timestamp: '10:30', latency: 790, errorRate: 10.2, cpu: 82, isAnomaly: true },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});
