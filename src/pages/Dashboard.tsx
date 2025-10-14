import React from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { Dashboard as DashboardContent } from '../components/Dashboard/Dashboard';

export const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <DashboardContent onViewChange={() => {}} />
    </MainLayout>
  );
}; 

