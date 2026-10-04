import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, type Column } from '../components/ui/Table';
import {
  AlertOctagon,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  GitCommit,
  Clock,
  ShieldAlert,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';

export interface IncidentItem {
  id: string;
  serviceName: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  probableCauseChange?: string;
  confidenceScore?: number;
  startedAt: string;
  resolvedAt?: string | null;
  relatedChangesCount?: number;
  createdAt: string;
}

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIncidents({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        service: serviceFilter !== 'ALL' ? serviceFilter : undefined,
      });
      setIncidents(data || []);
    } catch (err: any) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter, serviceFilter]);

  const handleQuickStatusUpdate = async (
    e: React.MouseEvent,
    id: string,
    nextStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  ) => {
    e.stopPropagation();
    setIsUpdatingStatus(id);
    try {
      await api.updateIncidentStatus(id, nextStatus);
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: nextStatus } : inc))
      );
    } catch (err) {
      console.error('Failed to update incident status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Filtered in-memory for search query
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.serviceName.toLowerCase().includes(q) ||
      (inc.probableCauseChange && inc.probableCauseChange.toLowerCase().includes(q)) ||
      inc.id.toLowerCase().includes(q)
    );
  });

  // Calculate summary stats
  const totalCount = incidents.length;
  const openCount = incidents.filter((i) => i.status === 'OPEN').length;
  const investigatingCount = incidents.filter((i) => i.status === 'INVESTIGATING').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;

  const columns: Column<IncidentItem>[] = [
    {
      key: 'severity',
      header: 'Severity & ID',
      width: '130px',
      render: (item) => (
        <div className="space-y-1">
          <Badge
            variant={
              item.severity === 'CRITICAL'
                ? 'critical'
                : item.severity === 'HIGH'
                ? 'high'
                : item.severity === 'MEDIUM'
                ? 'medium'
                : 'info'
            }
          >
            {item.severity}
          </Badge>
          <div className="text-[11px] font-mono text-slate-400">
            {item.id.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Incident & Service',
      render: (item) => (
        <div>
          <div className="font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1">
            {item.title}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/40">
              {item.serviceName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'probableCause',
      header: 'Likely Root Cause',
      render: (item) => (
        <div className="space-y-1">
          {item.probableCauseChange ? (
            <div className="flex items-start gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-mono font-medium text-slate-200 block truncate max-w-xs">
                  {item.probableCauseChange}
                </span>
                {item.confidenceScore !== undefined && (
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {item.confidenceScore}% confidence
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">No correlated change identified</span>
          )}
        </div>
      ),
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
              item.riskScore >= 75
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                : item.riskScore >= 50
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
            }`}
          >
            {item.riskScore}
          </div>
          <span className="text-[11px] text-slate-400 uppercase font-medium">
            {item.riskLevel}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '160px',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              item.status === 'OPEN'
                ? 'open'
                : item.status === 'INVESTIGATING'
                ? 'investigating'
                : 'resolved'
            }
          >
            {item.status}
          </Badge>
          <div className="flex items-center gap-1">
            {item.status === 'OPEN' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-1.5 text-amber-400 hover:text-amber-300"
                disabled={isUpdatingStatus === item.id}
                onClick={(e) => handleQuickStatusUpdate(e, item.id, 'INVESTIGATING')}
              >
                Acknowledge
              </Button>
            )}
            {item.status === 'INVESTIGATING' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-1.5 text-emerald-400 hover:text-emerald-300"
                disabled={isUpdatingStatus === item.id}
                onClick={(e) => handleQuickStatusUpdate(e, item.id, 'RESOLVED')}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs group-hover:border-indigo-500"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/incidents/${item.id}`);
          }}
          rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            Active & Past Incidents
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Degradation events correlated with likely change causes, confidence scores, and blast radius.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIncidents}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/incidents/inc-demo-1')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Flagship Incident
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-900/50 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Tracked</div>
            <div className="text-xl font-bold text-white">{totalCount}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-900/50 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Open / Critical</div>
            <div className="text-xl font-bold text-rose-400">
              {openCount} <span className="text-xs text-slate-500 font-normal">({criticalCount} crit)</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-900/50 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Investigating</div>
            <div className="text-xl font-bold text-amber-400">{investigatingCount}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-900/50 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Resolved</div>
            <div className="text-xl font-bold text-emerald-400">{resolvedCount}</div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search incidents by title, service, probable cause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter incidents by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Statuses</option>
                <option value="OPEN" className="bg-slate-900">Open</option>
                <option value="INVESTIGATING" className="bg-slate-900">Investigating</option>
                <option value="RESOLVED" className="bg-slate-900">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
              <select
                aria-label="Filter incidents by severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Severities</option>
                <option value="CRITICAL" className="bg-slate-900">Critical</option>
                <option value="HIGH" className="bg-slate-900">High</option>
                <option value="MEDIUM" className="bg-slate-900">Medium</option>
                <option value="LOW" className="bg-slate-900">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
              <select
                aria-label="Filter incidents by service"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Services</option>
                <option value="payment-service" className="bg-slate-900">payment-service</option>
                <option value="order-service" className="bg-slate-900">order-service</option>
                <option value="auth-service" className="bg-slate-900">auth-service</option>
                <option value="inventory-service" className="bg-slate-900">inventory-service</option>
                <option value="api-gateway" className="bg-slate-900">api-gateway</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Incidents Table */}
      <Table<IncidentItem>
        columns={columns}
        data={filteredIncidents}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/incidents/${item.id}`)}
        emptyMessage="No incidents match the selected filter criteria."
      />
    </div>
  );
};
