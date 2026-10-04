import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { Gauge } from '../components/ui/Gauge';
import { RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';

export const ChangesPage: React.FC = () => {
  const { environment, lastUpdated } = useFilters();
  const [changes, setChanges] = useState<any[]>([]);
  const [selectedChange, setSelectedChange] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const fetchChanges = async () => {
    setIsLoading(true);
    try {
      const data = await api.getChanges();
      setChanges(data);
    } catch {
      // Fallback demo changes
      setChanges([
        {
          id: 'chg-1',
          serviceName: 'payment-service',
          changeType: 'DEPLOYMENT',
          title: 'Deploy payment-service:v2.4 - DB pool reconfiguration',
          author: 'ci-bot (github-actions)',
          environment: 'PROD',
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          riskScore: 87,
          riskLevel: 'HIGH',
          linkedIncidentsCount: 1,
          diff: {
            file: 'config/database.yaml',
            changes: [
              { key: 'pool.max_connections', old: 50, new: 5 },
              { key: 'pool.timeout_seconds', old: 30, new: 5 },
            ],
          },
          metadata: { commitSha: '9e7b21a', branch: 'main' },
        },
        {
          id: 'chg-2',
          serviceName: 'payment-service',
          changeType: 'SECURITY_GROUP_CHANGE',
          title: 'AuthorizeSecurityGroupIngress - Port 22 open to 0.0.0.0/0',
          author: 'devops-lead@acmecloud.io',
          environment: 'PROD',
          timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          riskScore: 92,
          riskLevel: 'HIGH',
          linkedIncidentsCount: 0,
          diff: { protocol: 'tcp', port: 22, cidr: '0.0.0.0/0' },
        },
        {
          id: 'chg-3',
          serviceName: 'order-service',
          changeType: 'DEPLOYMENT',
          title: 'Deploy order-service:v1.9 - Kafka consumer parallelization',
          author: 'ci-bot',
          environment: 'PROD',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          riskScore: 42,
          riskLevel: 'MEDIUM',
          linkedIncidentsCount: 0,
        },
        {
          id: 'chg-4',
          serviceName: 'auth-service',
          changeType: 'IAM_CHANGE',
          title: 'Attach AmazonS3ReadOnlyAccess to lambda-reports-role',
          author: 'admin@acmecloud.io',
          environment: 'PROD',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          riskScore: 38,
          riskLevel: 'MEDIUM',
          linkedIncidentsCount: 0,
        },
        {
          id: 'chg-5',
          serviceName: 'inventory-service',
          changeType: 'CONFIG_CHANGE',
          title: 'Update Redis maxmemory-policy to volatile-lru',
          author: 'sre-team',
          environment: 'PROD',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          riskScore: 24,
          riskLevel: 'LOW',
          linkedIncidentsCount: 0,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [environment, lastUpdated]);

  const handleRowClick = (change: any) => {
    setSelectedChange(change);
    setIsDrawerOpen(true);
  };

  const filteredChanges = changes.filter((c) => {
    if (filterType !== 'ALL' && c.changeType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Detected Cloud Changes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of deployments, configuration drift, database migrations, and IAM mutations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchChanges}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'DEPLOYMENT', 'CONFIG_CHANGE', 'IAM_CHANGE', 'SECURITY_GROUP_CHANGE'].map(
          (type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Changes' : type.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {/* Changes Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Change Type</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Description / Title</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4 text-center">Linked Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium bg-slate-950/40">
              {filteredChanges.map((change) => (
                <tr
                  key={change.id}
                  onClick={() => handleRowClick(change)}
                  className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Badge variant="info" size="sm">
                      {change.changeType}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                    {change.serviceName}
                  </td>
                  <td className="py-3 px-4 text-white max-w-sm truncate">{change.title}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {change.author}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(change.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-bold ${
                        change.riskScore >= 60
                          ? 'text-rose-400'
                          : change.riskScore >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {change.riskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {change.linkedIncidentsCount > 0 ? (
                      <Badge variant="critical" size="sm">
                        {change.linkedIncidentsCount} Incident
                      </Badge>
                    ) : (
                      <span className="text-slate-600 font-mono text-xs">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side Drawer for Change Inspection */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedChange?.title || 'Change Details'}
        subtitle={`Service: ${selectedChange?.serviceName} • Captured via AWS CloudTrail / CI Pipeline`}
        width="lg"
      >
        {selectedChange && (
          <div className="space-y-6">
            {/* Risk Gauge Header */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                  Change Risk Evaluation
                </span>
                <span className="text-xs text-slate-300 mt-1 block">
                  Environment: <strong className="text-white">{selectedChange.environment}</strong>
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Author: <strong className="text-indigo-300">{selectedChange.author}</strong>
                </span>
              </div>
              <Gauge score={selectedChange.riskScore} size={110} showLevel={false} />
            </div>

            {/* Before vs After Metric Impact */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Observed Telemetry Impact
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Baseline Latency p95</span>
                  <span className="font-mono text-base font-semibold text-emerald-400 mt-1 block">
                    120ms
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-rose-500/30">
                  <span className="text-slate-400 block">Post-Change Latency p95</span>
                  <span className="font-mono text-base font-semibold text-rose-400 mt-1 block">
                    {selectedChange.serviceName === 'payment-service' ? '850ms' : '125ms'}
                  </span>
                </div>
              </div>
            </div>

            {/* Diff Viewer */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Configuration Diff & Changeset
              </h4>
              <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedChange.diff || selectedChange.metadata || {}, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
