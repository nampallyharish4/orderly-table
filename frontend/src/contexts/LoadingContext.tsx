import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FullScreenLoader } from '@/components/ui/loader';

interface LoadingContextType {
  startLoading: (id?: string) => void;
  stopLoading: (id?: string) => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set());

  const startLoading = useCallback((id: string = 'global') => {
    setActiveRequests(prev => new Set(prev).add(id));
  }, []);

  const stopLoading = useCallback((id: string = 'global') => {
    setActiveRequests(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isLoading = activeRequests.size > 0;

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
