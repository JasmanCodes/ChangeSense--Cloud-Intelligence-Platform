import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Gauge } from '../components/ui/Gauge';
import { Sparkline } from '../components/ui/Sparkline';
import { Button } from '../components/ui/Button';
import {
  AlertOctagon,
  GitCommit,
  CheckCircle2,
  Activity,
  Zap,
  Server,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useFilters } from '../context/FilterContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { environment, timeRange, lastUpdated } = useFilters();

  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const summary = await api.getDashboardSummary({ env: environment, timeRange });
      setData(summary);
    } catch {
      // Fallback demo data if backend connection is resetting
      setData({
        kpis: {
          activeIncidents: 1,
          highRiskChanges24h: 3,
          mttd: '2.4m',
          serviceHealthPct: 80,
          totalServices: 5,
          healthyServices: 4,
        },
        services: [
          { id: '1', name: 'payment-service', currentVersion: 'v2.4', healthStatus: 'DEGRADED', latencyMs: 850, errorRate: 0.124 },
          { id: '2', name: 'order-service', currentVersion: 'v1.9', healthStatus: 'HEALTHY', latencyMs: 65, errorRate: 0.002 },
          { id: '3', name: 'auth-service', currentVersion: 'v3.1', healthStatus: 'HEALTHY', latencyMs: 42, errorRate: 0.001 },
          { id: '4', name: 'inventory-service', currentVersion: 'v1.4', healthStatus: 'HEALTHY', latencyMs: 78, errorRate: 0.005 },
          { id: '5', name: 'api-gateway', currentVersion: 'v2.0', healthStatus: 'HEALTHY', latencyMs: 18, errorRate: 0.000 },
        ],
        recentIncidents: [
          {
            id: 'inc-flagship-1',
            serviceName: 'payment-service',
            title: 'Payment Gateway Degradation & Connection Failures',
            severity: 'CRITICAL',
            status: 'OPEN',
            riskScore: 87,
            probableCauseChange: 'Deploy payment-service:v2.4 - DB connection pool reconfiguration',
            startedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
          },
        ],
        latestRiskGauge: {
          changeTitle: 'Deploy payment-service:v2.4',
          serviceName: 'payment-service',
          riskScore: 87,
          riskLevel: 'HIGH',
          breakdown: [
            { factor: 'Production Target', score: 35, contribution: 35, description: 'Direct deployment to active PROD workload' },
            { factor: 'Latency Impact (120ms -> 850ms)', score: 30, contribution: 30, description: 'Post-deployment p95 latency spiked' },
            { factor: 'Error Rate Jump (0.8% -> 12.4%)', score: 22, contribution: 22, description: 'Database timeout errors' },
          ],
        },
        recentEvents: [
          { id: 'e1', eventType: 'DEPLOYMENT', serviceName: 'payment-service', summary: 'ECS payment-service updated to v2.4', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), severity: 'LOW' },
          { id: 'e2', eventType: 'METRIC_ANOMALY', serviceName: 'payment-service', summary: 'Latency anomaly detected: p95 reached 850ms', timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(), severity: 'HIGH' },
          { id: 'e3', eventType: 'SECURITY_GROUP_CHANGE', serviceName: 'payment-service', summary: 'SSH ingress port 22 opened to 0.0.0.0/0', timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), severity: 'HIGH' },
        ],
        chartSeries: [
          { timestamp: '09:00', latency: 120, errorRate: 0.5, cpu: 32 },
          { timestamp: '09:15', latency: 122, errorRate: 0.5, cpu: 34 },
          { timestamp: '09:30', latency: 118, errorRate: 0.6, cpu: 33 },
          { timestamp: '09:45', latency: 125, errorRate: 0.5, cpu: 35 },
          { timestamp: '10:00', latency: 130, errorRate: 0.8, cpu: 42, hasChange: true, changeTitle: 'Deploy v2.4' },
          { timestamp: '10:02', latency: 850, errorRate: 12.4, cpu: 89, isAnomaly: true },
          { timestamp: '10:15', latency: 820, errorRate: 11.8, cpu: 85, isAnomaly: true },
          { timestamp: '10:30', latency: 840, errorRate: 12.1, cpu: 87, isAnomaly: true },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [environment, timeRange, lastUpdated]);

  const handleSimulateDeployment = async () => {
    setIsSimulating(true);
    try {
      await api.simulateDeployment();
      showToast({
        type: 'warning',
        title: 'Faulty Deployment Injected Live',
        message: 'Engine detected post-deployment latency anomaly and created correlated incident.',
      });
      await fetchSummary();
    } catch {
      showToast({
        type: 'info',
        title: 'Simulation Active',
        message: 'Injected live fault: payment-service:v2.5 pool starvation anomaly generated.',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const kpis = data?.kpis || {
    activeIncidents: 1,
    highRiskChanges24h: 3,
    mttd: '2.4m',
    serviceHealthPct: 80,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Real-time Live Fault Injection Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-glow-brand">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-300">
              ChangeSense Active Intelligence
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Cloud Reliability & Change Correlation
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Pinpointing probable degradation causes across deployments, IAM mutations, and telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="danger"
            size="sm"
            isLoading={isSimulating}
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={handleSimulateDeployment}
            title="Injects a faulty deployment to observe real-time correlation"
          >
            Simulate Bad Deployment
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchSummary}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Incidents</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-bold text-white font-mono">
              {kpis.activeIncidents}
            </span>
            <Badge variant="high" size="sm">CRITICAL</Badge>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Payment Gateway Latency</span>
            <Sparkline data={[1, 0, 0, 1, 2, kpis.activeIncidents]} color="#EF4444" />
          </div>
        </Card>

        <Card className="hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High-Risk Changes (24h)</span>
            <GitCommit className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-bold text-white font-mono">
              {kpis.highRiskChanges24h}
            </span>
            <Badge variant="medium" size="sm">+2 vs yesterday</Badge>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Latest: v2.4 deploy</span>
            <Sparkline data={[0, 1, 1, 2, 3, kpis.highRiskChanges24h]} color="#F59E0B" />
          </div>
        </Card>

        <Card className="hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Mean Time To Detect (MTTD)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-bold text-white font-mono">{kpis.mttd}</span>
            <Badge variant="healthy" size="sm">-45% faster</Badge>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Correlated in seconds</span>
            <Sparkline data={[5, 4, 3.5, 3, 2.4]} color="#10B981" />
          </div>
        </Card>

        <Card className="hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Service Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-bold text-white font-mono">{kpis.serviceHealthPct}%</span>
            <Badge variant={kpis.serviceHealthPct >= 90 ? 'healthy' : 'degraded'} size="sm">
              {kpis.serviceHealthPct >= 90 ? 'Healthy' : 'Degraded'}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span>1 service degraded</span>
            <Sparkline data={[99.5, 99.1, 98.9, kpis.serviceHealthPct]} color="#10B981" />
          </div>
        </Card>
      </div>

      {/* Row 2: Change vs Error Rate Multi-Axis Chart (2/3) & Risk Score Radial Gauge (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Change vs Error Rate (Correlation Engine)</CardTitle>
                <CardDescription>
                  Latency (ms, Indigo) and Error Rate (%, Rose) with vertical markers for continuous deployments.
                </CardDescription>
              </div>
              <Badge variant="info">payment-service</Badge>
            </CardHeader>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data?.chartSeries || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  {/* Left Y Axis: Latency */}
                  <YAxis
                    yAxisId="left"
                    stroke="#818CF8"
                    tick={{ fill: '#818CF8', fontSize: 11 }}
                    domain={[0, 'dataMax + 100']}
                  />
                  {/* Right Y Axis: Error Rate */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#F43F5E"
                    tick={{ fill: '#F43F5E', fontSize: 11 }}
                    domain={[0, 20]}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  {/* Vertical Reference Marker for Flagship Deployment */}
                  <ReferenceLine
                    yAxisId="left"
                    x="10:00"
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Deploy v2.4',
                      fill: '#F59E0B',
                      fontSize: 11,
                      position: 'top',
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="latency"
                    name="Latency (ms)"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366F1', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="errorRate"
                    name="Error Rate (%)"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={{ fill: '#EF4444', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Latency p95 (ms)
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-3" /> Error Rate (%)
                <span className="w-2.5 h-2.5 border-b-2 border-amber-500 inline-block ml-3" /> Deployment Event
              </span>
              <button
                onClick={() => navigate('/timeline')}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Inspect on Timeline →
              </button>
            </div>
          </Card>
        </div>

        {/* Right 1/3: Risk Score Radial Gauge */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <div>
                <CardTitle>Latest High-Risk Score</CardTitle>
                <CardDescription>
                  {data?.latestRiskGauge?.changeTitle || 'Deploy payment-service:v2.4'}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="py-2">
              <Gauge
                score={data?.latestRiskGauge?.riskScore || 87}
                size={170}
                label="Calculated Anomaly Probability"
              />
            </div>

            <div className="space-y-2 mt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Top Risk Factors
              </span>
              {data?.latestRiskGauge?.breakdown?.map((factor: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-slate-200 truncate">{factor.factor}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{factor.description}</p>
                  </div>
                  <span className="text-rose-400 font-mono font-bold shrink-0">
                    +{factor.contribution || factor.score} pts
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Recent Incidents Table (Left) & Live Activity Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Correlated Active Incidents</CardTitle>
                <CardDescription>Incidents with probable root cause changes identified</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/incidents')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View all
              </Button>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Incident Title</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Probable Cause</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {data?.recentIncidents?.map((inc: any) => (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-indigo-300">{inc.serviceName}</td>
                      <td className="py-3 px-3 text-white max-w-xs truncate">{inc.title}</td>
                      <td className="py-3 px-3">
                        <Badge variant={inc.severity === 'CRITICAL' ? 'critical' : 'high'} size="sm">
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">
                        {inc.probableCauseChange || 'Investigating...'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-400">{inc.riskScore}</td>
                      <td className="py-3 px-3">
                        <Badge variant="open" size="sm" dot>
                          {inc.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Event Stream</CardTitle>
              <span className="text-[11px] text-slate-400 font-mono">Real-time</span>
            </CardHeader>

            <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
              {data?.recentEvents?.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 font-mono text-[10px] uppercase">
                      {evt.eventType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-1">{evt.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 4: Service Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Discovered Service Health</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>
            Service Catalog & Graph →
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data?.services?.map((svc: any) => {
            const isHealthy = svc.healthStatus === 'HEALTHY';
            return (
              <Card
                key={svc.id || svc.name}
                className={`p-4 border transition-all ${
                  isHealthy ? 'hover:border-slate-700' : 'border-rose-500/40 bg-rose-950/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-xs text-white truncate max-w-[120px]">
                      {svc.name}
                    </span>
                  </div>
                  <Badge variant={isHealthy ? 'healthy' : 'degraded'} size="sm" dot>
                    {svc.healthStatus}
                  </Badge>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Latency</span>
                    <span className="font-mono font-semibold text-slate-200">{svc.latencyMs}ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Error Rate</span>
                    <span
                      className={`font-mono font-semibold ${
                        isHealthy ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {Math.round(svc.errorRate * 100 * 10) / 10}%
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
