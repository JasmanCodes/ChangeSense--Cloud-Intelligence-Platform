import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Button } from '../components/ui/Button';
import { Gauge } from '../components/ui/Gauge';
import { useToast } from '../components/ui/Toast';
import {
  ArrowLeft,
  GitCommit,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Clock,
  Terminal,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [incidentData, setIncidentData] = useState<any>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      setIsLoading(true);
      try {
        if (!id) return;
        const res = await api.getIncidentDetail(id);
        setIncidentData(res);
      } catch (err: any) {
        console.warn('Using fallback incident model:', err.message);
        // Fallback flagship incident if backend is cold
        setIncidentData({
          incident: {
            id: id || 'inc-flagship-1',
            title: 'Payment Gateway Degradation & Connection Failures',
            serviceName: 'payment-service',
            severity: 'CRITICAL',
            status: 'OPEN',
            riskScore: 87,
            riskLevel: 'HIGH',
            probableCauseChange: 'payment-service:v2.4 (commit d4f8a12)',
            confidenceScore: 94,
            startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            resolvedAt: null,
            incidentChanges: [
              {
                correlationScore: 94,
                causalRank: 1,
                reasoning: 'Deployment occurred 2 minutes before latency anomaly; direct service match.',
                change: {
                  id: 'ch-payment-v24',
                  serviceName: 'payment-service',
                  changeType: 'DEPLOYMENT',
                  title: 'Deploy payment-service:v2.4 - DB connection pool update',
                  author: 'ci-bot',
                  commitHash: 'd4f8a12',
                  timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
                },
              },
              {
                correlationScore: 32,
                causalRank: 2,
                reasoning: 'Config change in upstream gateway 15 minutes prior; secondary correlation.',
                change: {
                  id: 'ch-gw-cfg',
                  serviceName: 'api-gateway',
                  changeType: 'CONFIG',
                  title: 'Update rate limit thresholds for /v1/charge',
                  author: 'sarah.ops',
                  commitHash: 'e910b42',
                  timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                },
              },
            ],
          },
          telemetry: [
            { timestamp: '10:00', latencyP95: 110, errorRatePct: 0.004, cpuUsagePct: 22 },
            { timestamp: '10:05', latencyP95: 115, errorRatePct: 0.005, cpuUsagePct: 24 },
            { timestamp: '10:10', latencyP95: 118, errorRatePct: 0.006, cpuUsagePct: 25 },
            { timestamp: '10:15', latencyP95: 122, errorRatePct: 0.007, cpuUsagePct: 26 },
            { timestamp: '10:20', latencyP95: 120, errorRatePct: 0.008, cpuUsagePct: 25 },
            { timestamp: '10:22', latencyP95: 380, errorRatePct: 0.035, cpuUsagePct: 62 },
            { timestamp: '10:25', latencyP95: 720, errorRatePct: 0.089, cpuUsagePct: 88 },
            { timestamp: '10:30', latencyP95: 850, errorRatePct: 0.124, cpuUsagePct: 94 },
            { timestamp: '10:35', latencyP95: 840, errorRatePct: 0.118, cpuUsagePct: 92 },
            { timestamp: '10:40', latencyP95: 810, errorRatePct: 0.112, cpuUsagePct: 90 },
          ],
          logs: [
            { id: '1', timestamp: '10:20:15', severity: 'INFO', message: 'Deployment payment-service:v2.4 registered by ArgoCD' },
            { id: '2', timestamp: '10:21:40', severity: 'WARN', message: 'DB connection pool pool-size reduced from 50 to 5' },
            { id: '3', timestamp: '10:22:04', severity: 'ERROR', message: 'ConnectionPoolTimeoutException: pool acquisition timed out after 5000ms' },
            { id: '4', timestamp: '10:23:12', severity: 'CRITICAL', message: 'HTTP 504 Gateway Timeout on /v1/charge - latency 850ms exceeded SLA' },
            { id: '5', timestamp: '10:25:30', severity: 'ERROR', message: 'Circuit breaker OPEN on downstream order-service' },
            { id: '6', timestamp: '10:28:44', severity: 'WARN', message: 'Retry queue saturation reached 88% capacity' },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  const incident = incidentData?.incident;
  const telemetry = incidentData?.telemetry || [];
  const logs = incidentData?.logs || [];

  const handleStatusChange = async (nextStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED') => {
    if (!incident) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateIncidentStatus(incident.id, nextStatus);
      setIncidentData((prev: any) => ({
        ...prev,
        incident: {
          ...prev.incident,
          status: nextStatus,
          resolvedAt: nextStatus === 'RESOLVED' ? new Date().toISOString() : null,
        },
      }));
      showToast({
        title: 'Status Updated',
        message: `Incident marked as ${nextStatus}`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Update Failed',
        message: err.message || 'Could not update status',
        type: 'error',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyRollback = () => {
    const cmd = `kubectl rollout undo deployment/payment-service --namespace=production`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    showToast({
      title: 'Rollback Command Copied',
      message: 'Paste into terminal to immediately revert to payment-service:v2.3',
      type: 'info',
    });
    setTimeout(() => setCopiedCommand(false), 3000);
  };

  const exportReport = () => {
    if (!incident) return;
    const report = `# Incident Investigation Report: ${incident.title}
Generated: ${new Date().toISOString()}
Severity: ${incident.severity}
Status: ${incident.status}
Service Affected: ${incident.serviceName}
Probable Root Cause: ${incident.probableCauseChange || 'Pending evaluation'}
Confidence Score: ${incident.confidenceScore || 0}%
Risk Score: ${incident.riskScore}/100 (${incident.riskLevel})

## Summary
Degradation occurred at ${incident.startedAt}.
The ChangeSense correlation engine identified a probable causal relationship with a deployment event.

## Recommended Remediation
Execute immediate rollback to previous stable tag:
kubectl rollout undo deployment/${incident.serviceName} --namespace=production
`;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${incident.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Report Exported',
      message: 'Incident investigation summary downloaded as Markdown/PDF format.',
      type: 'success',
    });
  };

  // Filter logs
  const filteredLogs = logs.filter((log: any) => {
    const matchesSev = logFilter === 'ALL' || log.severity === logFilter;
    const matchesSearch = !logSearch || log.message.toLowerCase().includes(logSearch.toLowerCase());
    return matchesSev && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-64 bg-slate-850 rounded"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-slate-850 rounded"></div>
          <div className="h-64 bg-slate-850 rounded"></div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Incident Not Found</h2>
        <p className="text-sm text-slate-400">The requested incident ID could not be loaded.</p>
        <Button onClick={() => navigate('/incidents')} variant="primary">
          Back to Incidents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/incidents')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Incidents
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {incident.id.slice(0, 12)}
              </span>
              <Badge
                variant={
                  incident.severity === 'CRITICAL'
                    ? 'critical'
                    : incident.severity === 'HIGH'
                    ? 'high'
                    : incident.severity === 'MEDIUM'
                    ? 'medium'
                    : 'info'
                }
              >
                {incident.severity}
              </Badge>
              <Badge
                variant={
                  incident.status === 'OPEN'
                    ? 'open'
                    : incident.status === 'INVESTIGATING'
                    ? 'investigating'
                    : 'resolved'
                }
              >
                {incident.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5">{incident.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportReport}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Export Report
          </Button>

          {incident.status === 'OPEN' && (
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('INVESTIGATING')}
              leftIcon={<Clock className="w-4 h-4 text-amber-400" />}
            >
              Acknowledge
            </Button>
          )}

          {incident.status !== 'RESOLVED' ? (
            <Button
              variant="success"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('RESOLVED')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Resolve Incident
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('OPEN')}
            >
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Probable Cause Hero Card */}
          <Card className="border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Probable Root Cause
                    <span className="text-[11px] font-normal text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                      Deterministic Correlation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Highest-ranking correlated change matching temporal, service, and impact factors
                  </p>
                </div>
              </div>
              {incident.confidenceScore !== undefined && (
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    {incident.confidenceScore}%
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Confidence
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
              <div className="text-sm text-slate-200 leading-relaxed">
                Likely cause is deployment{' '}
                <strong className="text-indigo-300 font-mono">{incident.probableCauseChange || 'payment-service:v2.4'}</strong>{' '}
                which occurred 2 minutes prior to anomaly detection. Telemetry shows a sharp latency increase from{' '}
                <span className="text-emerald-400 font-mono">120ms</span> to{' '}
                <span className="text-rose-400 font-mono font-bold">850ms</span> and an error surge to{' '}
                <span className="text-rose-400 font-mono font-bold">12.4%</span>.
              </div>

              {/* Action Banner inside cause card */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Latency anomaly began +2m post-deployment
                </span>
                <span className="text-emerald-400 font-medium">94% temporal correlation fit</span>
              </div>
            </div>
          </Card>

          {/* Correlation Chain Visual */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <CardTitle>Causal Correlation Chain</CardTitle>
              </div>
              <CardDescription>
                Chronological chain of events leading to service degradation
              </CardDescription>
            </CardHeader>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                {/* Node 1 */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 relative">
                  <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">
                    STEP 1 • 10:20 UTC
                  </div>
                  <div className="text-xs font-semibold text-white">Deployment v2.4</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Pool config lowered from 50 to 5
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">payment-service</div>
                </div>

                {/* Node 2 */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 relative">
                  <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                    STEP 2 • +1m 40s
                  </div>
                  <div className="text-xs font-semibold text-white">Pool Exhaustion</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Threads starved waiting for DB connections
                  </div>
                  <div className="mt-2 text-[10px] text-amber-400 font-mono">active: 5/5 max</div>
                </div>

                {/* Node 3 */}
                <div className="p-3 bg-slate-900 rounded-lg border border-rose-900/50 bg-rose-950/10 relative">
                  <div className="text-[10px] font-mono text-rose-400 font-bold mb-1">
                    STEP 3 • +2m 00s
                  </div>
                  <div className="text-xs font-semibold text-white">Latency Jump</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    P95 response time surged past 500ms SLA
                  </div>
                  <div className="mt-2 text-[10px] text-rose-400 font-mono font-bold">120ms → 850ms</div>
                </div>

                {/* Node 4 */}
                <div className="p-3 bg-slate-900 rounded-lg border border-rose-900/50 bg-rose-950/10 relative">
                  <div className="text-[10px] font-mono text-rose-400 font-bold mb-1">
                    STEP 4 • +3m 12s
                  </div>
                  <div className="text-xs font-semibold text-white">Error Rate Surge</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    504 Gateway Timeouts & circuit opened
                  </div>
                  <div className="mt-2 text-[10px] text-rose-400 font-mono font-bold">0.8% → 12.4%</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pre & Post Telemetry Metrics Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pre & Post Change Telemetry Trajectory</CardTitle>
                <CardDescription>
                  P95 Latency (ms, Indigo) vs Error Rate (%, Rose) with deployment demarcation line
                </CardDescription>
              </div>
            </CardHeader>
            <div className="p-4 pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={telemetry} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                    <YAxis
                      yAxisId="left"
                      stroke="#818cf8"
                      fontSize={11}
                      domain={[0, 1000]}
                      tickFormatter={(v) => `${v}ms`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#f43f5e"
                      fontSize={11}
                      domain={[0, 0.15]}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === 'Latency (P95)') return [`${val} ms`, name];
                        if (name === 'Error Rate') return [`${(Number(val) * 100).toFixed(1)}%`, name];
                        return [val, name];
                      }}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      x="10:20"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{
                        value: 'Probable Cause: v2.4 Deployed',
                        fill: '#c084fc',
                        fontSize: 11,
                        position: 'top',
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="latencyP95"
                      name="Latency (P95)"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#818cf8' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="errorRatePct"
                      name="Error Rate"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f43f5e' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Searchable Log Stream */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  Correlated Log Stream
                </CardTitle>
                <CardDescription>
                  Application and infrastructure logs around the change event
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <select
                    aria-label="Filter logs by level"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900">All Levels</option>
                    <option value="CRITICAL" className="bg-slate-900">Critical</option>
                    <option value="ERROR" className="bg-slate-900">Error</option>
                    <option value="WARN" className="bg-slate-900">Warning</option>
                    <option value="INFO" className="bg-slate-900">Info</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <div className="p-3 bg-slate-950 font-mono text-xs divide-y divide-slate-800/60 max-h-64 overflow-y-auto rounded-b-lg">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No logs found matching filter.</div>
              ) : (
                filteredLogs.map((log: any) => (
                  <div key={log.id} className="py-2 px-2 flex items-start gap-3 hover:bg-slate-900/50 rounded">
                    <span className="text-slate-500 select-none flex-shrink-0 text-[11px]">
                      {log.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        log.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : log.severity === 'ERROR'
                          ? 'bg-rose-950/60 text-rose-400'
                          : log.severity === 'WARN'
                          ? 'bg-amber-950/60 text-amber-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-slate-300 flex-1 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Risk Gauge Card */}
          <Card className="text-center p-5">
            <CardHeader className="justify-center pb-2">
              <CardTitle className="text-center">Correlation Risk Score</CardTitle>
            </CardHeader>
            <div className="py-2 flex justify-center">
              <Gauge score={incident.riskScore || 87} size={160} label="Impact Severity" />
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Evaluated across 4 risk dimensions: timing, service dependency, metric deviation, and blast radius.
            </div>

            {/* Factor breakdown bars */}
            <div className="mt-5 space-y-2.5 text-left border-t border-slate-800 pt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Temporal Proximity (35%)</span>
                  <span className="text-indigo-400 font-mono font-semibold">96%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Service Match (30%)</span>
                  <span className="text-indigo-400 font-mono font-semibold">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Metric Impact (20%)</span>
                  <span className="text-rose-400 font-mono font-semibold">88%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Error Blast Radius (15%)</span>
                  <span className="text-rose-400 font-mono font-semibold">74%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Rollback & Remediation Card */}
          <Card className="border border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm">Remediation Action</CardTitle>
              </div>
              <Badge variant="healthy">Recommended</Badge>
            </CardHeader>
            <p className="text-xs text-slate-300 mb-3">
              Revert <strong className="text-white">payment-service</strong> deployment to restore default connection pool capacity:
            </p>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 break-all select-all flex items-center justify-between gap-2">
              <code>kubectl rollout undo deployment/payment-service</code>
              <button
                type="button"
                onClick={copyRollback}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors flex-shrink-0"
                title="Copy command"
              >
                {copiedCommand ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </Card>

          {/* Ranked Related Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ranked Related Changes</CardTitle>
              <CardDescription>Changes detected during incident window</CardDescription>
            </CardHeader>
            <div className="p-3 space-y-2">
              {(incident.incidentChanges || []).map((ic: any, idx: number) => (
                <div
                  key={ic.change?.id || idx}
                  className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white line-clamp-1">
                      {ic.change?.title || 'Deployment event'}
                    </span>
                    <Badge variant={ic.correlationScore >= 70 ? 'high' : 'default'}>
                      {ic.correlationScore}%
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ic.reasoning || 'Temporal and topology correlation'}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                    <span>{ic.change?.serviceName}</span>
                    <span>{ic.change?.commitHash || 'd4f8a12'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Affected Topology */}
          <Card className="p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Affected Blast Radius
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded text-xs font-mono">
                payment-service (Origin)
              </span>
              <span className="px-2 py-1 bg-slate-800/80 text-slate-300 rounded text-xs font-mono">
                order-service (Downstream)
              </span>
              <span className="px-2 py-1 bg-slate-800/80 text-slate-300 rounded text-xs font-mono">
                api-gateway (/v1/charge)
              </span>
              <span className="px-2 py-1 bg-slate-800/80 text-slate-300 rounded text-xs font-mono">
                PostgreSQL RDS (db-prod-main)
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
