import React from 'react';

interface HelpLayoutProps {
  children: React.ReactNode;
}


export const HelpLayout: React.FC<HelpLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <main className="py-4 sm:py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}; 