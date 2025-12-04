import { useCallback } from 'react';

/**
 * Hook for integrating AI Chat Bot into different parts of the app
 * Provides context-aware query suggestions and integration helpers
 */
export const useAIChatIntegration = () => {
  /**
   * Get context-aware query suggestions based on current page/view
   */
  const getContextualQueries = useCallback((context: {
    page?: string;
    category?: string;
    accountId?: string;
    dateRange?: string;
  }) => {
    const queries: string[] = [];

    switch (context.page) {
      case 'dashboard':
        queries.push(
          "What's my financial summary?",
          "How much did I spend this month?",
          "What's my balance?",
          "Show spending by category"
        );
        break;
      case 'transactions':
        queries.push(
          "Show recent transactions",
          "What are my top spending categories?",
          "How much did I spend last month?",
          "Compare this month vs last month"
        );
        break;
      case 'reports':
      case 'analytics':
        queries.push(
          "Spending forecast",
          "Burn rate",
          "Any unusual spending?",
          "Give me recommendations"
        );
        break;
      case 'budgets':
        queries.push(
          "Am I over budget?",
          "Budget status",
          "Budget remaining"
        );
        break;
      case 'savings':
        queries.push(
          "How are my savings goals?",
          "Goal progress",
          "Savings goals"
        );
        break;
      case 'investments':
        queries.push(
          "What's my portfolio value?",
          "Investment return",
          "Portfolio performance"
        );
        break;
      default:
        queries.push(
          "What's my balance?",
          "How much did I spend this month?",
          "Show spending by category"
        );
    }

    if (context.category) {
      queries.push(`How much did I spend on ${context.category}?`);
    }

    if (context.dateRange) {
      queries.push(`How much did I spend ${context.dateRange}?`);
    }

    return queries;
  }, []);

  /**
   * Generate a query based on context
   */
  const generateContextualQuery = useCallback((context: {
    action?: 'analyze' | 'compare' | 'forecast' | 'recommend';
    category?: string;
    dateRange?: string;
    metric?: string;
  }) => {
    if (context.action === 'analyze' && context.category) {
      return `Analyze my spending on ${context.category}`;
    }
    if (context.action === 'compare' && context.dateRange) {
      return `Compare spending ${context.dateRange}`;
    }
    if (context.action === 'forecast') {
      return "Spending forecast";
    }
    if (context.action === 'recommend') {
      return "Give me recommendations";
    }
    if (context.metric) {
      return `What's my ${context.metric}?`;
    }
    return "What's my financial summary?";
  }, []);

  return {
    getContextualQueries,
    generateContextualQuery,
  };
};

