import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useOrg } from '../../context/OrgContext';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { selectedDisabledService, closeEnableModal, enableService } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleConfirmEnable = () => {
    if (!selectedDisabledService) return;
    enableService(selectedDisabledService.key);
    showToast({
      type: 'success',
      title: 'Service Activated',
      message: `${selectedDisabledService.title} has been enabled for your organization.`,
    });
    const targetRoute = selectedDisabledService.route;
    closeEnableModal();
    navigate(targetRoute);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19] text-slate-100">
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Enable Service Modal */}
      {selectedDisabledService && (
        <Modal
          isOpen={!!selectedDisabledService}
          onClose={closeEnableModal}
          title={`Enable ${selectedDisabledService.title}`}
          description="Activate this capability to unlock real-time change intelligence and correlated telemetry."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-indigo-100">
                  Instant Activation
                </span>
                {selectedDisabledService.shortDesc}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Included Features
              </p>
              <ul className="space-y-2">
                {selectedDisabledService.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={closeEnableModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                onClick={handleConfirmEnable}
              >
                Enable for Organization
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
