import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Environment } from '../types';

export type TimeRange = '1h' | '6h' | '24h' | '7d' | 'custom';

interface FilterContextValue {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lastUpdated: Date;
  triggerRefresh: () => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment, setEnvironment] = useState<Environment>('PROD');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const triggerRefresh = () => {
    setLastUpdated(new Date());
  };

  // Real-time 30-second interval auto-refresh as required in Section 13
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        environment,
        setEnvironment,
        timeRange,
        setTimeRange,
        searchQuery,
        setSearchQuery,
        lastUpdated,
        triggerRefresh,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
