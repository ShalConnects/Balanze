import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  wrapAsync: <T extends (...args: any[]) => Promise<any>>(
    asyncFn: T
  ) => (...args: Parameters<T>) => Promise<ReturnType<T>>;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  loadingMessage: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const wrapAsync = useCallback(<T extends (...args: any[]) => Promise<any>>(
    asyncFn: T
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      setIsLoading(true);
      try {
        const result = await asyncFn(...args);
        return result;
      } finally {
        setIsLoading(false);
      }
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setLoadingMessageHandler = useCallback((message: string) => {
    setLoadingMessage(message);
  }, []);

  const value: LoadingContextType = {
    isLoading,
    wrapAsync,
    setLoading,
    setLoadingMessage: setLoadingMessageHandler,
    loadingMessage
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}; 

