import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { useOrg, CATALOG_SERVICES } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import {
  Building,
  Cloud,
  CheckCircle2,
  Users,
  Bell,
  Key,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('aws');
  const { currentOrg, isServiceEnabled, enableService, disableService } = useOrg();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [roleArn, setRoleArn] = useState('arn:aws:iam::123456789012:role/ChangeSense-ReadRole');
  const [isTesting, setIsTesting] = useState(false);

  const tabs = [
    { id: 'aws', label: 'AWS Connections', icon: <Cloud className="w-4 h-4" /> },
    { id: 'services', label: 'Services Catalog', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'org', label: 'Organization', icon: <Building className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'API & Security', icon: <Key className="w-4 h-4" /> },
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied to clipboard',
      message: `${label} copied.`,
    });
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      showToast({
        type: 'success',
        title: 'AWS Connection Verified',
        message: 'Successfully assumed role and verified CloudTrail & CloudWatch permissions.',
      });
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your organization, AWS cross-account AssumeRole connections, and enabled capabilities.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: AWS Connections */}
      {activeTab === 'aws' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cross-Account IAM AssumeRole Connection</CardTitle>
                <CardDescription>
                  ChangeSense connects to your AWS account without long-term access keys using secure STS AssumeRole.
                </CardDescription>
              </div>
              <Badge variant="healthy" dot>CONNECTED</Badge>
            </CardHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                    ChangeSense Host Account ID
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm text-slate-200">123456789012</span>
                    <button
                      onClick={() => handleCopy('123456789012', 'Account ID')}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Unique Org External ID
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm text-indigo-400 truncate max-w-[200px]">
                      {currentOrg?.externalId || 'ext-783921-acme'}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(currentOrg?.externalId || 'ext-783921-acme', 'External ID')
                      }
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Client IAM Role ARN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roleArn}
                    onChange={(e) => setRoleArn(e.target.value)}
                    placeholder="arn:aws:iam::123456789012:role/ChangeSense-ReadRole"
                    className="flex-1 px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isTesting}
                    onClick={handleTestConnection}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Prefer automated setup? Deploy the CloudFormation template directly.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() =>
                    window.open(
                      'https://console.aws.amazon.com/cloudformation/home',
                      '_blank'
                    )
                  }
                >
                  CloudFormation Stack
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Services Catalog */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Enabled Platform Services</CardTitle>
                <CardDescription>
                  Toggle specific platform capabilities on or off for {currentOrg?.name}.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="divide-y divide-slate-800">
              {CATALOG_SERVICES.map((svc) => {
                const enabled = isServiceEnabled(svc.key);
                return (
                  <div
                    key={svc.key}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white">{svc.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{svc.shortDesc}</p>
                    </div>

                    <Button
                      variant={enabled ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => {
                        if (enabled) {
                          disableService(svc.key);
                          showToast({
                            type: 'info',
                            title: 'Service Disabled',
                            message: `${svc.title} has been deactivated.`,
                          });
                        } else {
                          enableService(svc.key);
                          showToast({
                            type: 'success',
                            title: 'Service Enabled',
                            message: `${svc.title} is now active.`,
                          });
                        }
                      }}
                    >
                      {enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Organization */}
      {activeTab === 'org' && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Company profile and billing attributes</CardDescription>
          </CardHeader>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Organization Name</span>
              <p className="text-sm font-semibold text-white mt-1">{currentOrg?.name}</p>
            </div>
            <div>
              <span className="text-slate-400">Industry</span>
              <p className="text-sm text-slate-200 mt-1">{currentOrg?.industry || 'Cloud Computing & SaaS'}</p>
            </div>
            <div>
              <span className="text-slate-400">Team Size</span>
              <p className="text-sm text-slate-200 mt-1">{currentOrg?.teamSize || '50-200'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Team */}
      {activeTab === 'team' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Team Members & Access Roles</CardTitle>
              <CardDescription>Manage Admins (AWS management) and Viewers (Read-only)</CardDescription>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Invite Member
            </Button>
          </CardHeader>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  AR
                </div>
                <div>
                  <p className="font-semibold text-white">{user?.name || 'Alex Rivera'}</p>
                  <p className="text-slate-400">{user?.email || 'alex@acmecloud.io'}</p>
                </div>
              </div>
              <Badge variant="info">ADMIN</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Notifications */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>Slack webhooks, email alerts, and PagerDuty routing</CardDescription>
          </CardHeader>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Slack Channel #prod-incidents</p>
                <p className="text-slate-400">Webhook configured for HIGH and CRITICAL alerts</p>
              </div>
              <Badge variant="healthy">ACTIVE</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>API & Security Governance</CardTitle>
            <CardDescription>External ID rotation and API keys</CardDescription>
          </CardHeader>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div>
                <p className="font-semibold text-white">Rotate STS External ID</p>
                <p className="text-slate-400">Generate a new random External ID for your IAM trust policies</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  showToast({
                    type: 'success',
                    title: 'External ID Rotated',
                    message: 'New External ID has been generated.',
                  })
                }
              >
                Rotate Now
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
