import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  GitCommit,
  Layers,
  Shield,
  Server,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';

export const TimelinePage: React.FC = () => {
  const { environment, lastUpdated } = useFilters();
  const [selectedType, setSelectedType] = useState('ALL');
  const [overlayAnomalies, setOverlayAnomalies] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTimeline({
        type: selectedType !== 'ALL' ? selectedType : undefined,
        env: environment !== 'PROD' ? environment : undefined,
      });
      setEvents(data);
    } catch {
      // Fallback demo events
      setEvents([
        {
          id: 'evt-1',
          eventType: 'DEPLOYMENT',
          source: 'aws.ecs',
          serviceName: 'payment-service',
          resourceName: 'payment-ecs-task',
          severity: 'HIGH',
          summary: 'Deploy payment-service:v2.4 - DB connection pool reconfiguration',
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          metadata: {
            commit: '9e7b21a',
            author: 'ci-bot',
            configChanges: { pool_size: { from: 50, to: 5 } },
          },
        },
        {
          id: 'evt-2',
          eventType: 'METRIC_ANOMALY',
          source: 'aws.cloudwatch',
          serviceName: 'payment-service',
          resourceName: 'alb-payment',
          severity: 'CRITICAL',
          summary: 'Latency jumped 120ms → 850ms, error rate reached 12.4%',
          timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
          metadata: { metric: 'latency', threshold: 500, value: 850 },
        },
        {
          id: 'evt-3',
          eventType: 'SECURITY_GROUP_CHANGE',
          source: 'aws.cloudtrail',
          serviceName: 'payment-service',
          resourceName: 'sg-payment-prod-db',
          severity: 'HIGH',
          summary: 'AuthorizeSecurityGroupIngress: Port 22 open to 0.0.0.0/0',
          timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          metadata: { rule: 'SSH 22 Ingress', cidr: '0.0.0.0/0' },
        },
        {
          id: 'evt-4',
          eventType: 'CONFIG_CHANGE',
          source: 'aws.appconfig',
          serviceName: 'inventory-service',
          resourceName: 'redis-cache',
          severity: 'LOW',
          summary: 'Update Redis maxmemory-policy to volatile-lru',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          metadata: { policy: 'volatile-lru' },
        },
        {
          id: 'evt-5',
          eventType: 'DEPLOYMENT',
          source: 'aws.ecs',
          serviceName: 'order-service',
          resourceName: 'order-ecs-task',
          severity: 'MEDIUM',
          summary: 'Deploy order-service:v1.9 - Kafka consumer parallelization',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          metadata: { commit: '4ac910b', author: 'ci-bot' },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedType, environment, lastUpdated]);

  const filterButtons = [
    { label: 'All Events', value: 'ALL' },
    { label: 'Deployments', value: 'DEPLOYMENT' },
    { label: 'Config Changes', value: 'CONFIG_CHANGE' },
    { label: 'IAM Changes', value: 'IAM_CHANGE' },
    { label: 'Security Groups', value: 'SECURITY_GROUP_CHANGE' },
    { label: 'Scaling', value: 'SCALING' },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'DEPLOYMENT':
        return <GitCommit className="w-4 h-4 text-indigo-400" />;
      case 'CONFIG_CHANGE':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'IAM_CHANGE':
      case 'SECURITY_GROUP_CHANGE':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'METRIC_ANOMALY':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  const displayedEvents = events.filter((evt) => {
    if (!overlayAnomalies && evt.eventType === 'METRIC_ANOMALY') return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Change & Event Chronology</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential ordering of infrastructure mutations and correlated telemetry anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={overlayAnomalies ? 'primary' : 'outline'}
            size="sm"
            leftIcon={<Layers className="w-4 h-4" />}
            onClick={() => setOverlayAnomalies(!overlayAnomalies)}
          >
            {overlayAnomalies ? 'Anomalies Overlaid' : 'Overlay Anomalies'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchTimeline}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setSelectedType(btn.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedType === btn.value
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {displayedEvents.map((evt) => {
          const isExpanded = expandedEventId === evt.id;
          const isAnomaly = evt.eventType === 'METRIC_ANOMALY';

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 mt-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  isAnomaly
                    ? 'bg-rose-950 border-rose-500 text-rose-400 ring-4 ring-rose-950/40'
                    : 'bg-slate-900 border-indigo-500 text-indigo-400 ring-4 ring-slate-900'
                }`}
              >
                {getEventIcon(evt.eventType)}
              </div>

              {/* Event Content Card */}
              <Card
                className={`p-4 transition-all ${
                  isAnomaly ? 'border-rose-500/30 bg-rose-950/10' : 'hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Badge variant={isAnomaly ? 'high' : 'info'} size="sm">
                      {evt.eventType}
                    </Badge>
                    <span className="font-mono text-xs font-semibold text-indigo-300">
                      {evt.serviceName}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      {evt.source || 'aws.cloudtrail'}
                    </span>
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title={isExpanded ? 'Collapse JSON' : 'Expand JSON'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-white mt-2">{evt.summary}</p>

                {/* Expandable JSON / Diffs */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                        Metadata & Configuration Payload
                      </span>
                    </div>
                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(evt.metadata || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
