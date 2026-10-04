import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useOrg, CATALOG_SERVICES } from '../context/OrgContext';
import { useToast } from '../components/ui/Toast';
import {
  Building2,
  Cloud,
  ArrowRight,
  ArrowLeft,
  Copy,
  Zap,
  Database,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { currentOrg, setCurrentOrg, enabledServices, enableService, disableService } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Step 1 State: Organization Profile
  const [companyName, setCompanyName] = useState(currentOrg?.name || 'Acme Cloud Platform');
  const [industry, setIndustry] = useState(currentOrg?.industry || 'Fintech & Payments');
  const [teamSize, setTeamSize] = useState(currentOrg?.teamSize || '50-200');

  // Step 3 State: AWS Connection
  const [roleArn, setRoleArn] = useState('arn:aws:iam::123456789012:role/ChangeSense-ReadRole');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    if (currentOrg) {
      setCurrentOrg({
        ...currentOrg,
        name: companyName,
        industry,
        teamSize,
      });
    }
    setStep(2);
  };

  const handleUseDemoData = () => {
    showToast({
      type: 'success',
      title: 'Demo Environment Seeded',
      message: 'Loaded 5 services, 30 changes, and 6 correlated incidents into your workspace.',
    });
    navigate('/home');
  };

  const handleConnectAws = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      showToast({
        type: 'success',
        title: 'AWS Account Connected',
        message: 'STS AssumeRole verified. Real-time telemetry ingestion active.',
      });
      navigate('/home');
    }, 1200);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied to clipboard',
      message: `${label} copied.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-4 py-12">
      {/* Top Progress Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-slate-300">
            Step {step} of 3: {step === 1 ? 'Organization Profile' : step === 2 ? 'Select Services' : 'Connect AWS Account'}
          </span>
          <span className="font-mono text-indigo-400">
            {step === 1 ? '33%' : step === 2 ? '66%' : '100%'}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl">
        {/* STEP 1: CREATE ORGANIZATION */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Create your Organization</CardTitle>
                  <CardDescription>
                    Provide your company profile for multi-tenant data partitioning.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Acme Cloud, Netflix"
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Fintech & Payments">Fintech & Payments</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="SaaS & Cloud Software">SaaS & Cloud Software</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Media & Entertainment">Media & Entertainment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Engineering Team Size
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1-10 engineers">1-10 engineers</option>
                    <option value="10-50 engineers">10-50 engineers</option>
                    <option value="50-200 engineers">50-200 engineers</option>
                    <option value="200+ engineers">200+ engineers</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Services
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 2: CHOOSE SERVICES */}
        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div>
                <CardTitle>Choose Capabilities to Enable</CardTitle>
                <CardDescription>
                  Select which intelligence modules to activate for your organization.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3">
              {CATALOG_SERVICES.map((service) => {
                const isEnabled = enabledServices[service.key];
                return (
                  <div
                    key={service.key}
                    onClick={() => {
                      if (isEnabled) disableService(service.key);
                      else enableService(service.key);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isEnabled
                        ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{service.title}</span>
                        <Badge variant={isEnabled ? 'healthy' : 'outline'} size="sm">
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {service.shortDesc}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setStep(3)}
              >
                Continue to AWS Connection
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: CONNECT AWS OR USE DEMO DATA */}
        {step === 3 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Connect AWS Account or Use Demo Data</CardTitle>
                  <CardDescription>
                    ChangeSense connects via secure cross-account STS AssumeRole.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-4">
              {/* Highlight Option: Use Demo Data */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-glow-brand flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-sm text-white">Instant Exploration with Demo Data</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    Preloads 5 microservices, 14 days of metrics, 30 changes, and the Payment v2.4 incident scenario instantly.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUseDemoData}
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Use Demo Data
                </Button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Or Connect Live AWS
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Live AWS Form */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                      Our Host Account ID
                    </span>
                    <span className="font-mono text-slate-200 mt-1 block">123456789012</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                      Your Organization External ID
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-indigo-400 truncate max-w-[170px]">
                        {currentOrg?.externalId || 'ext-acme-789'}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(currentOrg?.externalId || 'ext-acme-789', 'External ID')
                        }
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your IAM Role ARN
                  </label>
                  <input
                    type="text"
                    value={roleArn}
                    onChange={(e) => setRoleArn(e.target.value)}
                    placeholder="arn:aws:iam::123456789012:role/ChangeSense-ReadRole"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  isLoading={isVerifying}
                  onClick={handleConnectAws}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify & Enter Dashboard
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
