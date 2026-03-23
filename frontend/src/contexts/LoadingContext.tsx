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

  React.useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      // List of endpoints that should NOT trigger a global blocking loader
      // e.g., background polling for real-time updates
      const isBackgroundRequest = 
        (args[1]?.method === 'GET' || !args[1]?.method) && 
        (url.includes('/api/orders') || url.includes('/api/tables') || url.includes('/api/menu-items') || url.includes('/api/categories'));

      if (!isBackgroundRequest) {
        startLoading(url);
      }

      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        if (!isBackgroundRequest) {
          stopLoading(url);
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
      {isLoading && <FullScreenLoader />}
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
