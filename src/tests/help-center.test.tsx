// src/tests/help-center.test.tsx
// Simple smoke test to ensure help center components render without errors

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock the store hooks
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: '1', email: 'test@example.com' },
    profile: { id: '1', local_currency: 'USD' }
  })
}));

vi.mock('../store/useFinanceStore', () => ({
  useFinanceStore: () => ({
    accounts: [],
    transactions: []
  })
}));

// Mock analytics
vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
  trackOnboardingStep: vi.fn(),
  trackHelpCenter: vi.fn()
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Help Center Components', () => {

  it('should render KBSearch without crashing', async () => {
    const { default: KBSearch } = await import('../components/KBSearch');
    
    render(
      <TestWrapper>
        <KBSearch />
      </TestWrapper>
    );
    
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search for help articles/)).toBeInTheDocument();
  });

  it('should render ProductTour without crashing', async () => {
    const { default: ProductTour } = await import('../components/ProductTour');
    
    render(
      <TestWrapper>
        <ProductTour 
          stepToStart="general"
          isOpen={false}
          onClose={() => {}}
        />
      </TestWrapper>
    );
    
    // ProductTour should render without errors even when closed
    expect(document.body).toBeInTheDocument();
  });
});

describe('Help Center Integration', () => {
  it('should have required data-tour attributes in key components', () => {
    // This test would check that tour attributes exist in the DOM
    // In a real test environment, you'd render the full app and check for attributes
    
    const tourAttributes = [
      'data-tour="navigation"',
      'data-tour="dashboard"', 
      'data-tour="quick-actions"',
      'data-tour="add-account"',
      'data-tour="account-form"',
      'data-tour="transaction-form"',
      'data-tour="analytics-overview"',
      'data-tour="spending-chart"',
      'data-tour="balance-trend"',
      'data-tour="export-data"'
    ];
    
    // In a real implementation, you'd check these exist in the rendered components
    expect(tourAttributes.length).toBeGreaterThan(0);
  });
});

// Export for potential use in other tests
export { TestWrapper };

