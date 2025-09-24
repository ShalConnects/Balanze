import React, { useState, useMemo } from 'react';
import { qualitativeCategories, getCategoryColor } from '../../styles/colors';

interface FlowData {
  source: string;
  target: string;
  value: number;
}

interface SankeyNode {
  id: string;
  label: string;
  type: 'source' | 'target';
  value: number;
  color: string;
}

interface SankeyViewProps {
  data?: FlowData[];
  className?: string;
  currency?: string;
}

// Mock data generator for money flow
const generateMockFlowData = (): FlowData[] => {
  const sources = ['Salary', 'Freelance', 'Investments', 'Other Income'];
  const targets = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Savings', 'Investments'
  ];

  const flows: FlowData[] = [];
  
  sources.forEach((source, sourceIndex) => {
    const sourceAmount = Math.floor(Math.random() * 50000) + 20000;
    let remaining = sourceAmount;
    
    // Distribute source amount across targets
    targets.forEach((target, targetIndex) => {
      if (remaining > 0 && (targetIndex === targets.length - 1 || Math.random() > 0.3)) {
        const amount = targetIndex === targets.length - 1 
          ? remaining 
          : Math.floor(Math.random() * (remaining * 0.4));
        
        if (amount > 0) {
          flows.push({
            source,
            target,
            value: amount
          });
          remaining -= amount;
        }
      }
    });
  });

  return flows.filter(flow => flow.value > 0);
};

// Simplified Sankey visualization using CSS and positioning
const SimplifiedSankey: React.FC<{ 
  nodes: SankeyNode[]; 
  flows: FlowData[]; 
  currency: string;
}> = ({ nodes, flows, currency }) => {
  const sources = nodes.filter(n => n.type === 'source');
  const targets = nodes.filter(n => n.type === 'target');
  
  const formatCurrency = (value: number) => `${currency}${value.toLocaleString()}`;
  
  return (
    <div className="relative h-96 bg-gray-50 rounded-lg p-6 overflow-hidden">
      {/* Sources Column */}
      <div className="absolute left-6 top-6 bottom-6 w-32">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Income Sources</h4>
        <div className="space-y-3">
          {sources.map((source, index) => (
            <div
              key={source.id}
              className="p-3 rounded-lg border-l-4 bg-white shadow-sm"
              style={{ borderLeftColor: source.color }}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {source.label}
              </p>
              <p className="text-xs text-gray-600">
                {formatCurrency(source.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Flow Lines (simplified representation) */}
      <div className="absolute left-40 right-40 top-6 bottom-6">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Money Flow</p>
            <p className="text-xs text-gray-500">
              {flows.length} transactions
            </p>
          </div>
        </div>
      </div>
      
      {/* Targets Column */}
      <div className="absolute right-6 top-6 bottom-6 w-32">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Spending Categories</h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {targets.map((target, index) => (
            <div
              key={target.id}
              className="p-2 rounded-lg border-r-4 bg-white shadow-sm"
              style={{ borderRightColor: target.color }}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {target.label}
              </p>
              <p className="text-xs text-gray-600">
                {formatCurrency(target.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fallback list view for accessibility and when Sankey is too complex
const FlowListView: React.FC<{ 
  flows: FlowData[]; 
  currency: string;
}> = ({ flows, currency }) => {
  const formatCurrency = (value: number) => `${currency}${value.toLocaleString()}`;
  
  const groupedFlows = flows.reduce((acc, flow) => {
    if (!acc[flow.source]) acc[flow.source] = [];
    acc[flow.source].push(flow);
    return acc;
  }, {} as Record<string, FlowData[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFlows).map(([source, sourceFlows]) => (
        <div key={source} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">{source}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sourceFlows
              .sort((a, b) => b.value - a.value)
              .map((flow, index) => (
                <div key={`${flow.source}-${flow.target}`} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(index).color }}
                    />
                    <span className="text-sm text-gray-700">{flow.target}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(flow.value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SankeyView: React.FC<SankeyViewProps> = ({ 
  data = generateMockFlowData(),
  className = '',
  currency = '₹'
}) => {
  const [viewMode, setViewMode] = useState<'sankey' | 'list'>('sankey');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const { nodes, totalIncome, totalExpenses, netFlow } = useMemo(() => {
    const sourceMap = new Map<string, number>();
    const targetMap = new Map<string, number>();
    
    data.forEach(flow => {
      sourceMap.set(flow.source, (sourceMap.get(flow.source) || 0) + flow.value);
      targetMap.set(flow.target, (targetMap.get(flow.target) || 0) + flow.value);
    });

    const sources: SankeyNode[] = Array.from(sourceMap.entries()).map(([id, value], index) => ({
      id,
      label: id,
      type: 'source',
      value,
      color: getCategoryColor(index, false).color
    }));

    const targets: SankeyNode[] = Array.from(targetMap.entries()).map(([id, value], index) => ({
      id,
      label: id,
      type: 'target',
      value,
      color: getCategoryColor(index + sources.length, false).color
    }));

    const totalIn = sources.reduce((sum, node) => sum + node.value, 0);
    const totalOut = targets.reduce((sum, node) => sum + node.value, 0);

    return {
      nodes: [...sources, ...targets],
      totalIncome: totalIn,
      totalExpenses: totalOut,
      netFlow: totalIn - totalOut
    };
  }, [data]);

  const formatCurrency = (value: number) => `${currency}${Math.abs(value).toLocaleString()}`;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Money Flow
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Income sources to spending categories
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select month"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'sankey' ? 'list' : 'sankey')}
            className="px-3 py-1 text-xs font-medium rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Switch to ${viewMode === 'sankey' ? 'list' : 'diagram'} view`}
          >
            {viewMode === 'sankey' ? 'List View' : 'Diagram View'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700 font-medium">TOTAL INCOME</p>
          <p className="text-lg font-semibold text-green-900">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700 font-medium">TOTAL EXPENSES</p>
          <p className="text-lg font-semibold text-red-900">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">NET FLOW</p>
          <p className={`text-lg font-semibold ${
            netFlow >= 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96" role="img" aria-label="Money flow from income sources to spending categories">
        {viewMode === 'sankey' ? (
          <SimplifiedSankey nodes={nodes} flows={data} currency={currency} />
        ) : (
          <FlowListView flows={data} currency={currency} />
        )}
      </div>

      {/* Flow Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Flow Insights</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            • Your largest income source is <strong>{nodes.find(n => n.type === 'source' && n.value === Math.max(...nodes.filter(n => n.type === 'source').map(n => n.value)))?.label}</strong>
          </p>
          <p>
            • Your biggest expense category is <strong>{nodes.find(n => n.type === 'target' && n.value === Math.max(...nodes.filter(n => n.type === 'target').map(n => n.value)))?.label}</strong>
          </p>
          <p>
            • You have a {netFlow >= 0 ? 'positive' : 'negative'} net flow of <strong>{formatCurrency(netFlow)}</strong> this month
          </p>
        </div>
      </div>

      {/* Hidden data table for screen readers */}
      <div className="sr-only">
        <table>
          <caption>Money flow from income sources to spending categories for {months[selectedMonth]}</caption>
          <thead>
            <tr>
              <th>Income Source</th>
              <th>Spending Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((flow, index) => (
              <tr key={index}>
                <td>{flow.source}</td>
                <td>{flow.target}</td>
                <td>{formatCurrency(flow.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SankeyView;
