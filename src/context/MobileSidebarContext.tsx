import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MobileSidebarContextType {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined);

export const useMobileSidebar = () => {
  const context = useContext(MobileSidebarContext);
  if (context === undefined) {
    throw new Error('useMobileSidebar must be used within a MobileSidebarProvider');
  }
  return context;
};

interface MobileSidebarProviderProps {
  children: ReactNode;
}

export const MobileSidebarProvider: React.FC<MobileSidebarProviderProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <MobileSidebarContext.Provider value={{ isMobileSidebarOpen, setIsMobileSidebarOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}; 

