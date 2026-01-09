import React from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { Dashboard as DashboardContent } from '../components/Dashboard/Dashboard';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <ErrorBoundary>
        <DashboardContent onViewChange={() => {}} />
      </ErrorBoundary>
    </MainLayout>
  );
}; 

