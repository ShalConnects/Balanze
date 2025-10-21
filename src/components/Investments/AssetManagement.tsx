import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff,
  MoreVertical,
  DollarSign
} from 'lucide-react';
import { InvestmentAsset, InvestmentFilters, AssetPerformance } from '../../types/investment';
import { formatCurrency } from '../../utils/currency';
import { SkeletonCard } from '../common/Skeleton';

interface AssetManagementProps {
  assets: InvestmentAsset[];
  loading?: boolean;
  onAddAsset?: () => void;
  onEditAsset?: (asset: InvestmentAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  onViewAsset?: (asset: InvestmentAsset) => void;
}

export const AssetManagement: React.FC<AssetManagementProps> = ({
  assets,
  loading = false,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onViewAsset
}) => {
  const [filters, setFilters] = useState<InvestmentFilters>({
    searchTerm: '',
    assetTypeFilter: '',
    categoryFilter: '',
    dateRange: { start: '', end: '' },
    minValue: 0,
    maxValue: 0,
    showOnlyActive: true
  });
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'gain_loss' | 'return_percentage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAssets = assets.filter(asset => {
    if (filters.showOnlyActive && !asset.is_active) return false;
    if (filters.searchTerm && !asset.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
        !asset.symbol.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    if (filters.assetTypeFilter && asset.asset_type !== filters.assetTypeFilter) return false;
    if (filters.minValue > 0 && asset.total_value < filters.minValue) return false;
    if (filters.maxValue > 0 && asset.total_value > filters.maxValue) return false;
    return true;
  }).sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'value':
        aValue = a.total_value;
        bValue = b.total_value;
        break;
      case 'gain_loss':
        aValue = a.unrealized_gain_loss;
        bValue = b.unrealized_gain_loss;
        break;
      case 'return_percentage':
        aValue = a.cost_basis > 0 ? (a.unrealized_gain_loss / a.cost_basis) * 100 : 0;
        bValue = b.cost_basis > 0 ? (b.unrealized_gain_loss / b.cost_basis) * 100 : 0;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPerformanceIcon = (value: number) => {
    return value >= 0 ? TrendingUp : TrendingDown;
  };

  const getReturnPercentage = (asset: InvestmentAsset) => {
    if (asset.cost_basis === 0) return 0;
    return (asset.unrealized_gain_loss / asset.cost_basis) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <SkeletonCard className="h-8 w-48" />
          <SkeletonCard className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Assets</h2>
          <p className="text-gray-600">Manage your investment portfolio</p>
        </div>
        <button
          onClick={onAddAsset}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.assetTypeFilter}
              onChange={(e) => setFilters({ ...filters, assetTypeFilter: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="stock">Stock</option>
              <option value="bond">Bond</option>
              <option value="etf">ETF</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="crypto">Crypto</option>
              <option value="commodity">Commodity</option>
              <option value="real_estate">Real Estate</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="value-desc">Value High-Low</option>
              <option value="value-asc">Value Low-High</option>
              <option value="gain_loss-desc">Gain High-Low</option>
              <option value="gain_loss-asc">Gain Low-High</option>
              <option value="return_percentage-desc">Return High-Low</option>
              <option value="return_percentage-asc">Return Low-High</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                <input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => setFilters({ ...filters, minValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                <input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({ ...filters, maxValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showOnlyActive}
                    onChange={(e) => setFilters({ ...filters, showOnlyActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const PerformanceIcon = getPerformanceIcon(asset.unrealized_gain_loss);
          const returnPercentage = getReturnPercentage(asset);
          
          return (
            <div key={asset.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">
                      {asset.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{asset.symbol}</h3>
                    <p className="text-sm text-gray-500">{asset.name}</p>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Value</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(asset.total_value)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost Basis</span>
                  <span className="text-sm text-gray-900">
                    {formatCurrency(asset.cost_basis)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gain/Loss</span>
                  <div className="flex items-center gap-1">
                    <PerformanceIcon className={`w-4 h-4 ${getPerformanceColor(asset.unrealized_gain_loss)}`} />
                    <span className={`font-semibold ${getPerformanceColor(asset.unrealized_gain_loss)}`}>
                      {formatCurrency(asset.unrealized_gain_loss)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Return</span>
                  <span className={`font-semibold ${getPerformanceColor(returnPercentage)}`}>
                    {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shares</span>
                  <span className="text-sm text-gray-900">
                    {asset.total_shares.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="text-sm text-gray-900">
                    {formatCurrency(asset.current_price)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewAsset?.(asset)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => onEditAsset?.(asset)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteAsset?.(asset.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-500 mb-4">
            {filters.searchTerm || filters.assetTypeFilter 
              ? 'Try adjusting your filters to see more results.'
              : 'Start building your investment portfolio by adding your first asset.'
            }
          </p>
          <button
            onClick={onAddAsset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Asset
          </button>
        </div>
      )}
    </div>
  );
};
