import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { FilterProvider } from './context/FilterContext';
import { ToastProvider } from './components/ui/Toast';

import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { TimelinePage } from './pages/TimelinePage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { ChangesPage } from './pages/ChangesPage';
import { SecurityPage } from './pages/SecurityPage';
import { ServicesPage } from './pages/ServicesPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OrgProvider>
            <FilterProvider>
              <ToastProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Public Auth & Onboarding Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />

                    {/* Authenticated Global Layout Shell Routes */}
                    <Route element={<AppShell />}>
                      <Route path="/home" element={<HomePage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/timeline" element={<TimelinePage />} />
                      <Route path="/incidents" element={<IncidentsPage />} />
                      <Route path="/incidents/:id" element={<IncidentDetailPage />} />
                      <Route path="/changes" element={<ChangesPage />} />
                      <Route path="/security" element={<SecurityPage />} />
                      <Route path="/services" element={<ServicesPage />} />
                      <Route path="/assistant" element={<AssistantPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>

                    {/* Default Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </BrowserRouter>
              </ToastProvider>
            </FilterProvider>
          </OrgProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
