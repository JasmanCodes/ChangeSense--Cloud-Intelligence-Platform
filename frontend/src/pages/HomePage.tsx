import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useOrg, CATALOG_SERVICES } from '../context/OrgContext';
import type { CatalogServiceInfo } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import {
  GitCommit,
  AlertOctagon,
  ShieldAlert,
  Bot,
  CheckCircle2,
  Lock,
  ArrowRight,
  Cloud,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { currentOrg, isServiceEnabled, openEnableModal, refreshOrg } = useOrg();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoData();
      showToast({
        type: 'success',
        title: 'Demo Environment Seeded',
        message: 'Successfully generated 5 services, 30 changes, and 6 incidents.',
      });
      await refreshOrg();
      navigate('/dashboard');
    } catch {
      showToast({
        type: 'info',
        title: 'Demo Dataset Active',
        message: 'Loaded Payment v2.4 scenario and 5 microservices.',
      });
      navigate('/dashboard');
    } finally {
      setIsSeeding(false);
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'GitCommit':
        return <GitCommit className="w-5 h-5 text-indigo-400" />;
      case 'AlertOctagon':
        return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-violet-400" />;
      default:
        return <GitCommit className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleAction = (service: CatalogServiceInfo) => {
    if (isServiceEnabled(service.key)) {
      navigate(service.route);
    } else {
      openEnableModal(service);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Greeting */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Engineer'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              ChangeSense monitors <strong className="text-slate-200">{currentOrg?.name || 'your cloud'}</strong> to detect what changed, what degraded afterward, and assess probable cause.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isSeeding}
              leftIcon={<Zap className="w-4 h-4 text-indigo-400" />}
              onClick={handleSeedDemoData}
            >
              Seed Demo Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              onClick={() => navigate('/settings')}
            >
              AWS Connections
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Overview
            </Button>
          </div>
        </div>
      </div>

      {/* Grid of 4 Service Cards (2x2 on desktop) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Platform Capabilities</h2>
          <span className="text-xs text-slate-400">Enable or launch services for {currentOrg?.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CATALOG_SERVICES.map((service) => {
            const enabled = isServiceEnabled(service.key);

            return (
              <Card
                key={service.key}
                variant={enabled ? 'default' : 'glass'}
                className="flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                        {getServiceIcon(service.iconName)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{service.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{service.shortDesc}</p>
                      </div>
                    </div>
                    <Badge variant={enabled ? 'healthy' : 'outline'} size="sm" dot={enabled}>
                      {enabled ? 'Enabled' : 'Not enabled'}
                    </Badge>
                  </div>

                  <div className="my-4 py-3 px-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      What you get:
                    </p>
                    <ul className="space-y-1">
                      {service.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    Status: {enabled ? 'Active Monitoring' : 'Inactive'}
                  </span>
                  <Button
                    variant={enabled ? 'primary' : 'secondary'}
                    size="sm"
                    rightIcon={enabled ? <ArrowRight className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    onClick={() => handleAction(service)}
                  >
                    {enabled ? 'Open Service' : 'Enable Service'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connected Accounts Strip */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">AWS Production (Role: ChangeSense-ReadRole)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-emerald-400 font-medium">Healthy</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Account: <strong>1234-5678-9012</strong> • External ID: <strong>{currentOrg?.externalId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-slate-500" />
            Last synced 1m ago
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
          >
            Manage Accounts
          </Button>
        </div>
      </div>
    </div>
  );
};
