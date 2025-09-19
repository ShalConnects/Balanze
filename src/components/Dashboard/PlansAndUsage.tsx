import React, { useState } from 'react';
import { UsageTracker } from './UsageTracker';
import { Plans } from './Plans';
import { PaymentMethodManager } from './PaymentMethodManager';
import { useAuthStore } from '../../store/authStore';
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Wallet
} from 'lucide-react';

interface PlansAndUsageProps {
  hideTitle?: boolean;
}

export const PlansAndUsage: React.FC<PlansAndUsageProps> = ({ hideTitle = false }) => {
  const { profile } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState({
    usage: true, // Combined with recommendations
    plans: false,
    paymentMethods: false
  });

  // Check if user is on free plan
  const isFreeUser = !profile?.subscription?.plan || profile?.subscription?.plan === 'free';

  const toggleSection = (section: 'usage' | 'plans' | 'paymentMethods') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionCount = () => {
    return Object.values(expandedSections).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plans & Usage</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your current usage and explore available plans to optimize your experience
          </p>
        </div>
      )}

      {/* Global Controls */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sections expanded: {getSectionCount()}/3
            </span>
            <div className="flex gap-1">
              {Object.entries(expandedSections).map(([key, isExpanded]) => (
                <div
                  key={key}
                  className={`w-2 h-2 rounded-full ${
                        isExpanded 
                          ? key === 'usage' 
                            ? 'bg-blue-500' 
                            : key === 'plans'
                            ? 'bg-purple-500'
                            : 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button
             onClick={() => {
               const allExpanded = expandedSections.usage && expandedSections.plans && expandedSections.paymentMethods;
               setExpandedSections({
                 usage: !allExpanded,
                 plans: !allExpanded,
                 paymentMethods: !allExpanded
               });
             }}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
               expandedSections.usage && expandedSections.plans && expandedSections.paymentMethods
                 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                 : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
             }`}
           >
             {expandedSections.usage && expandedSections.plans && expandedSections.paymentMethods ? (
               <>
                 <EyeOff className="w-4 h-4" />
                 Collapse All
               </>
             ) : (
               <>
                 <Eye className="w-4 h-4" />
                 Expand All
               </>
             )}
           </button>
        </div>
      </div>


      {/* Available Plans Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('plans')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  Available Plans
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore and upgrade to premium plans
                </p>
              </div>
            </div>
            
            {/* Section Status Indicator */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              expandedSections.plans
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {expandedSections.plans ? 'Expanded' : 'Collapsed'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {expandedSections.plans ? (
              <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            )}
          </div>
        </button>
        
        {expandedSections.plans && (
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div className="p-4 bg-purple-50/30 dark:bg-purple-900/10">
              <Plans />
            </div>
          </div>
        )}
      </div>

      {/* Usage & Payment Methods - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage & Recommendations Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('usage')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    Usage & Recommendations
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor your current usage and get personalized recommendations
                  </p>
                </div>
              </div>
              
              {/* Section Status Indicator */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                expandedSections.usage
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {expandedSections.usage ? 'Expanded' : 'Collapsed'}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {expandedSections.usage ? (
                <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              )}
            </div>
          </button>
          
          {expandedSections.usage && (
            <div className="border-t border-gray-100 dark:border-gray-700">
              <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 space-y-6">
                {/* Upgrade Recommendations - Only show for free users */}
                {isFreeUser && (
                  <div>
                    <div className="space-y-4">
                      {/* Sample recommendations - you can make this dynamic based on actual usage */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Account Limit</h4>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            You're using 3/3 accounts. Consider upgrading for unlimited accounts.
                          </p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Transactions</h4>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            You have plenty of transaction capacity remaining.
                          </p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Usage */}
                <div>
                  <UsageTracker />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('paymentMethods')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                    Payment Methods
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your payment methods and billing information
                  </p>
                </div>
              </div>
              
              {/* Section Status Indicator */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                expandedSections.paymentMethods
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {expandedSections.paymentMethods ? 'Expanded' : 'Collapsed'}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {expandedSections.paymentMethods ? (
                <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              )}
            </div>
          </button>
          
          {expandedSections.paymentMethods && (
            <div className="border-t border-gray-100 dark:border-gray-700">
              <div className="p-4 bg-green-50/30 dark:bg-green-900/10">
                <PaymentMethodManager hideTitle />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
