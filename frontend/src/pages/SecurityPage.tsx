import React from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Security & Configuration Drift</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero-trust IAM policy expansion, public security groups, and baseline deviations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Mark All Reviewed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs text-slate-400">Open Security Groups</span>
          <p className="text-xl font-bold text-rose-400 mt-2">1 Finding</p>
          <span className="text-[11px] text-slate-500">Port 22 open to 0.0.0.0/0</span>
        </Card>
        <Card>
          <span className="text-xs text-slate-400">IAM Escalations</span>
          <p className="text-xl font-bold text-amber-400 mt-2">2 Policies</p>
          <span className="text-[11px] text-slate-500">AdministratorAccess granted</span>
        </Card>
        <Card>
          <span className="text-xs text-slate-400">S3 Bucket Access</span>
          <p className="text-xl font-bold text-emerald-400 mt-2">All Secure</p>
          <span className="text-[11px] text-slate-500">Public block enabled</span>
        </Card>
        <Card>
          <span className="text-xs text-slate-400">Config Drifts</span>
          <p className="text-xl font-bold text-indigo-400 mt-2">3 Unsaved</p>
          <span className="text-[11px] text-slate-500">Deviating from IaC</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Security Findings</CardTitle>
          <Badge variant="high">Action Required</Badge>
        </CardHeader>
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Rule-based Findings & Drift Comparison</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Phase 6 will bring interactive drift side-by-side diffs, one-click remediation, and audit trail tagging.
          </p>
        </div>
      </Card>
    </div>
  );
};
