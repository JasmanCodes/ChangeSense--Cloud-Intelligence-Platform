import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Organization } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export type ServiceKey =
  | 'change-tracking'
  | 'incident-detection'
  | 'security-drift'
  | 'ai-assistant';

export interface CatalogServiceInfo {
  key: ServiceKey;
  title: string;
  shortDesc: string;
  bullets: string[];
  route: string;
  iconName: string;
}

export const CATALOG_SERVICES: CatalogServiceInfo[] = [
  {
    key: 'change-tracking',
    title: 'Change Tracking & Timeline',
    shortDesc: 'Continuously captures deployments, infrastructure drift, IAM updates, and configuration mutations.',
    bullets: [
      'Multi-cloud & AWS CloudTrail change ingestion',
      'Correlated deployment & commit history',
      'Config snapshot diffs before & after events',
    ],
    route: '/timeline',
    iconName: 'GitCommit',
  },
  {
    key: 'incident-detection',
    title: 'Incident Detection & Root Cause',
    shortDesc: 'Identifies latency spikes and error rate jumps, matching them deterministically to prior changes.',
    bullets: [
      'Statistical anomaly detection over rolling baselines',
      'Automated probable cause ranking & confidence scores',
      'Pre-incident and post-incident metric correlation',
    ],
    route: '/incidents',
    iconName: 'AlertOctagon',
  },
  {
    key: 'security-drift',
    title: 'Security & Config Drift',
    shortDesc: 'Tracks risky permission escalations, open ports (SSH to 0.0.0.0/0), and unexpected resource modifications.',
    bullets: [
      'Zero-trust IAM policy expansion alerts',
      'Security group exposure monitoring',
      'Automated baseline drift inspection',
    ],
    route: '/security',
    iconName: 'ShieldAlert',
  },
  {
    key: 'ai-assistant',
    title: 'AI Incident Assistant',
    shortDesc: 'Grounds deep reasoning models across your telemetry, logs, and changes to explain what broke.',
    bullets: [
      'Gemini-powered root-cause summaries',
      'Evidence-grounded explanations with cited events',
      'Actionable mitigation and rollback steps',
    ],
    route: '/assistant',
    iconName: 'Bot',
  },
];

interface OrgContextValue {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  enabledServices: Record<ServiceKey, boolean>;
  isServiceEnabled: (key: ServiceKey) => boolean;
  enableService: (key: ServiceKey) => Promise<void>;
  disableService: (key: ServiceKey) => Promise<void>;
  refreshOrg: () => Promise<void>;
  selectedDisabledService: CatalogServiceInfo | null;
  openEnableModal: (service: CatalogServiceInfo) => void;
  closeEnableModal: () => void;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [currentOrg, setCurrentOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('cs_org');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'demo-org-1',
          name: 'Acme Cloud Platform',
          industry: 'Fintech & Payments',
          teamSize: '50-200',
          externalId: 'ext-783921-acme',
        };
  });

  const [enabledServices, setEnabledServices] = useState<Record<ServiceKey, boolean>>(() => {
    const saved = localStorage.getItem('cs_enabled_services');
    return saved
      ? JSON.parse(saved)
      : {
          'change-tracking': true,
          'incident-detection': true,
          'security-drift': true,
          'ai-assistant': true,
        };
  });

  const [selectedDisabledService, setSelectedDisabledService] = useState<CatalogServiceInfo | null>(null);

  const refreshOrg = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getOrg();
      if (data) {
        setCurrentOrg({
          id: data.id,
          name: data.name,
          industry: data.industry,
          teamSize: data.teamSize,
          externalId: data.externalId,
        });
        if (data.enabledServices) {
          setEnabledServices(data.enabledServices);
        }
      }
    } catch {
      // Keep local state if offline or demo
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshOrg();
    }
  }, [isAuthenticated, refreshOrg]);

  useEffect(() => {
    if (currentOrg) {
      localStorage.setItem('cs_org', JSON.stringify(currentOrg));
    }
  }, [currentOrg]);

  useEffect(() => {
    localStorage.setItem('cs_enabled_services', JSON.stringify(enabledServices));
  }, [enabledServices]);

  const isServiceEnabled = (key: ServiceKey) => !!enabledServices[key];

  const enableService = async (key: ServiceKey) => {
    setEnabledServices((prev) => ({ ...prev, [key]: true }));
    try {
      await api.toggleService(key, true);
    } catch {}
  };

  const disableService = async (key: ServiceKey) => {
    setEnabledServices((prev) => ({ ...prev, [key]: false }));
    try {
      await api.toggleService(key, false);
    } catch {}
  };

  const openEnableModal = (service: CatalogServiceInfo) => {
    setSelectedDisabledService(service);
  };

  const closeEnableModal = () => {
    setSelectedDisabledService(null);
  };

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        setCurrentOrg,
        enabledServices,
        isServiceEnabled,
        enableService,
        disableService,
        refreshOrg,
        selectedDisabledService,
        openEnableModal,
        closeEnableModal,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
