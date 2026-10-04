import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Server } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const services = [
    { name: 'payment-service', version: 'v2.4', status: 'DEGRADED', latency: '850ms', error: '12.4%' },
    { name: 'order-service', version: 'v1.9', status: 'HEALTHY', latency: '65ms', error: '0.02%' },
    { name: 'auth-service', version: 'v3.1', status: 'HEALTHY', latency: '42ms', error: '0.01%' },
    { name: 'inventory-service', version: 'v1.4', status: 'HEALTHY', latency: '78ms', error: '0.05%' },
    { name: 'api-gateway', version: 'v2.0', status: 'HEALTHY', latency: '18ms', error: '0.00%' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Discovered Services & Topology</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Microservice registry, runtime health metrics, dependency graph, and release versions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc) => (
          <Card key={svc.name} className="hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{svc.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400">{svc.version}</span>
                </div>
              </div>
              <Badge variant={svc.status === 'HEALTHY' ? 'healthy' : 'degraded'} size="sm" dot>
                {svc.status}
              </Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Latency p95</span>
                <p className="font-mono font-semibold text-slate-200 mt-0.5">{svc.latency}</p>
              </div>
              <div>
                <span className="text-slate-500">Error Rate</span>
                <p className={`font-mono font-semibold mt-0.5 ${svc.status === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {svc.error}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
