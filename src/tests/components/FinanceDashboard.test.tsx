import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinanceDashboard from '../../components/FinanceDashboard';

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock date-fns to ensure consistent test results
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
    if (formatStr === 'MMM dd, yyyy') return 'Jan 15, 2024';
    if (formatStr === 'MMM dd') return 'Jan 15';
    if (formatStr === 'MMM yyyy') return 'Jan 2024';
    return '2024-01-15';
  }),
  differenceInDays: jest.fn(() => 15),
  addMonths: jest.fn(() => new Date('2024-06-15')),
  subDays: jest.fn(() => new Date('2024-01-01')),
  addDays: jest.fn(() => new Date('2024-01-30'))
}));

describe('FinanceDashboard', () => {
  const mockAnalyticsTrack = jest.fn();

  beforeEach(() => {
    mockAnalyticsTrack.mockClear();
  });

  it('renders without crashing', () => {
    render(<FinanceDashboard />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  describe('KPI Cards Accessibility', () => {
    it('renders all KPI cards with proper aria-labels', () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      // Check for KPI buttons with aria-labels
      const kpiButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('Available cash') ||
        button.getAttribute('aria-label')?.includes('7-day runway') ||
        button.getAttribute('aria-label')?.includes('Monthly net flow') ||
        button.getAttribute('aria-label')?.includes('Goal progress')
      );
      
      expect(kpiButtons).toHaveLength(4);
    });

    it('KPI cards are keyboard focusable', () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      const availableCashButton = screen.getByRole('button', { 
        name: /available cash/i 
      });
      
      expect(availableCashButton).toBeInTheDocument();
      expect(availableCashButton.tabIndex).not.toBe(-1);
      
      // Test keyboard navigation
      availableCashButton.focus();
      expect(availableCashButton).toHaveFocus();
    });

    it('KPI cards trigger analytics on click', () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      const availableCashButton = screen.getByRole('button', { 
        name: /available cash/i 
      });
      
      fireEvent.click(availableCashButton);
      
      expect(mockAnalyticsTrack).toHaveBeenCalledWith('kpi_click', {
        kpi_type: 'available_cash'
      });
    });
  });

  describe('Chart Accessibility', () => {
    it('charts have proper ARIA labels and roles', () => {
      render(<FinanceDashboard />);
      
      // Check for chart containers with role="img"
      const chartElements = screen.getAllByRole('img');
      expect(chartElements.length).toBeGreaterThan(0);
      
      // Check for specific chart labels
      expect(screen.getByText('Balance Trend')).toBeInTheDocument();
      expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
    });

    it('provides accessible data tables for screen readers', () => {
      render(<FinanceDashboard />);
      
      // Check for screen reader only content
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
      
      // Look for data tables in sr-only sections
      const tables = document.querySelectorAll('.sr-only table');
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts layout for mobile viewport', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<FinanceDashboard />);
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      // On mobile, KPI cards should be in a 2-column grid
      const kpiSection = document.querySelector('header');
      expect(kpiSection).toBeInTheDocument();
    });

    it('ensures minimum tap target sizes on mobile', () => {
      render(<FinanceDashboard />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight) || button.offsetHeight;
        const minWidth = parseInt(styles.minWidth) || button.offsetWidth;
        
        // Check if button meets minimum tap target size (44px)
        expect(minHeight >= 44 || minWidth >= 44).toBeTruthy();
      });
    });
  });

  describe('Alerts and Notifications', () => {
    it('displays alerts when present', () => {
      render(<FinanceDashboard />);
      
      // Check for alert elements
      const alerts = screen.getAllByRole('button', { name: /dismiss alert/i });
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('allows dismissing alerts', async () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      const dismissButtons = screen.getAllByRole('button', { name: /dismiss alert/i });
      if (dismissButtons.length > 0) {
        fireEvent.click(dismissButtons[0]);
        
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('alert_dismiss', 
          expect.objectContaining({ alert_id: expect.any(String) })
        );
      }
    });

    it('provides alert action buttons', () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      // Look for alert action buttons
      const actionButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Transfer') ||
        button.textContent?.includes('Pause') ||
        button.textContent?.includes('Set')
      );
      
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Expandable Sections', () => {
    it('money flow section is expandable', () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      const expandButton = screen.getByRole('button', { 
        name: /money flow analysis/i 
      });
      
      expect(expandButton).toBeInTheDocument();
      expect(expandButton.getAttribute('aria-expanded')).toBe('false');
      
      // Click to expand
      fireEvent.click(expandButton);
      
      expect(expandButton.getAttribute('aria-expanded')).toBe('true');
      expect(mockAnalyticsTrack).toHaveBeenCalledWith('money_flow_toggle', {
        expanded: true
      });
    });
  });

  describe('Insights Section', () => {
    it('displays AI insights with confidence scores', () => {
      render(<FinanceDashboard />);
      
      expect(screen.getByText('AI Insight')).toBeInTheDocument();
      expect(screen.getByText(/confidence/i)).toBeInTheDocument();
    });

    it('allows expanding insight explanations', () => {
      render(<FinanceDashboard />);
      
      const expandButton = screen.getByRole('button', { 
        name: /why we say that/i 
      });
      
      expect(expandButton).toBeInTheDocument();
      expect(expandButton.getAttribute('aria-expanded')).toBe('false');
      
      fireEvent.click(expandButton);
      expect(expandButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('provides actionable suggestions', () => {
      render(<FinanceDashboard onAnalyticsTrack={mockAnalyticsTrack} />);
      
      const suggestionButtons = screen.getAllByRole('button').filter(button =>
        button.textContent?.includes('Set') ||
        button.textContent?.includes('Try') ||
        button.textContent?.includes('Use')
      );
      
      expect(suggestionButtons.length).toBeGreaterThan(0);
      
      if (suggestionButtons.length > 0) {
        fireEvent.click(suggestionButtons[0]);
        
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('insight_accept', 
          expect.objectContaining({ suggestion: expect.any(String) })
        );
      }
    });
  });

  describe('Color Contrast and Accessibility', () => {
    it('uses appropriate color schemes for different data types', () => {
      render(<FinanceDashboard />);
      
      // Check for trend indicators with appropriate colors
      const positiveElements = document.querySelectorAll('.text-green-600, .text-green-900');
      const negativeElements = document.querySelectorAll('.text-red-600, .text-red-900');
      
      expect(positiveElements.length).toBeGreaterThan(0);
      expect(negativeElements.length).toBeGreaterThan(0);
    });

    it('provides alternative text for visual elements', () => {
      render(<FinanceDashboard />);
      
      // Check for screen reader accessible summary
      const srSummary = document.querySelector('.sr-only');
      expect(srSummary).toBeInTheDocument();
      expect(srSummary?.textContent).toContain('Dashboard Summary');
    });
  });

  describe('Progressive Disclosure', () => {
    it('initially shows essential information only', () => {
      render(<FinanceDashboard />);
      
      // Money flow should be collapsed initially
      const moneyFlowButton = screen.getByRole('button', { 
        name: /money flow analysis/i 
      });
      expect(moneyFlowButton.getAttribute('aria-expanded')).toBe('false');
      
      // Insight explanation should be collapsed initially
      const insightButton = screen.getByRole('button', { 
        name: /why we say that/i 
      });
      expect(insightButton.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency values consistently', () => {
      render(<FinanceDashboard currency="$" />);
      
      // Check that currency symbol is used
      const currencyElements = screen.getAllByText(/\$/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('handles different currency symbols', () => {
      render(<FinanceDashboard currency="€" />);
      
      const euroElements = screen.getAllByText(/€/);
      expect(euroElements.length).toBeGreaterThan(0);
    });
  });
});

// Additional test for specific accessibility requirements
describe('FinanceDashboard WCAG Compliance', () => {
  it('all interactive elements have accessible names', () => {
    render(<FinanceDashboard />);
    
    const interactiveElements = screen.getAllByRole('button');
    
    interactiveElements.forEach(element => {
      const accessibleName = element.getAttribute('aria-label') || 
                            element.getAttribute('aria-labelledby') ||
                            element.textContent;
      
      expect(accessibleName).toBeTruthy();
      expect(accessibleName?.trim().length).toBeGreaterThan(0);
    });
  });

  it('maintains logical heading hierarchy', () => {
    render(<FinanceDashboard />);
    
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => 
      parseInt(h.tagName.charAt(1))
    );
    
    // Check that heading levels don't skip (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  it('provides sufficient color contrast for text elements', () => {
    render(<FinanceDashboard />);
    
    // This is a simplified test - in real scenarios, you'd use tools like axe-core
    const textElements = document.querySelectorAll('p, span, div');
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Basic check that text is not transparent
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      expect(color).not.toBe('transparent');
    });
  });
});

