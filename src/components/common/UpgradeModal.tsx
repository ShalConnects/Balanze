import React, { useState } from 'react';
import { X, Star, Zap, Check, ArrowUpRight, Users, Globe, BarChart3, Heart, Download, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayPalPaymentModal } from './PayPalPaymentModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'limit' | 'feature';
  feature?: string;
  currentUsage?: {
    current: number;
    limit: number;
    type: string;
  };
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  type,
  feature,
  currentUsage
}) => {
  const navigate = useNavigate();
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planId: string;
    planName: string;
    price: number;
    billingCycle: 'monthly' | 'one-time';
    features: string[];
  }>({
    isOpen: false,
    planId: '',
    planName: '',
    price: 0,
    billingCycle: 'monthly',
    features: [],
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Upgrade to Premium
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You've reached your Free plan limit. Upgrade to Premium for unlimited access!
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              const features = [
                'Unlimited accounts',
                'Unlimited currencies',
                'Advanced analytics',
                'Priority support',
                'Custom categories',
                'Lend & borrow tracking',
                'Advanced reporting',
                'Data export',
                'Last Wish - Digital Time Capsule'
              ];
              
              setPaymentModal({
                isOpen: true,
                planId: 'premium_monthly',
                planName: 'Premium',
                price: 12.99,
                billingCycle: 'monthly',
                features,
              });
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upgrade Now
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Maybe Later
          </button>
        </div>
      </div>

      {/* PayPal Payment Modal */}
      <PayPalPaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        planId={paymentModal.planId}
        planName={paymentModal.planName}
        price={paymentModal.price}
        billingCycle={paymentModal.billingCycle}
        features={paymentModal.features}
      />
    </div>
  );
};

// Specialized modals for common scenarios
export const AccountLimitModal: React.FC<{ isOpen: boolean; onClose: () => void; current: number; limit: number }> = ({ 
  isOpen, 
  onClose, 
  current, 
  limit 
}) => (
  <UpgradeModal
    isOpen={isOpen}
    onClose={onClose}
    type="limit"
    currentUsage={{ current, limit, type: 'accounts' }}
  />
);

export const CurrencyLimitModal: React.FC<{ isOpen: boolean; onClose: () => void; current: number; limit: number }> = ({ 
  isOpen, 
  onClose, 
  current, 
  limit 
}) => (
  <UpgradeModal
    isOpen={isOpen}
    onClose={onClose}
    type="limit"
    currentUsage={{ current, limit, type: 'currencies' }}
  />
);

export const TransactionLimitModal: React.FC<{ isOpen: boolean; onClose: () => void; current: number; limit: number }> = ({ 
  isOpen, 
  onClose, 
  current, 
  limit 
}) => (
  <UpgradeModal
    isOpen={isOpen}
    onClose={onClose}
    type="limit"
    currentUsage={{ current, limit, type: 'transactions' }}
  />
);

export const FeatureUpgradeModal: React.FC<{ isOpen: boolean; onClose: () => void; feature: string }> = ({ 
  isOpen, 
  onClose, 
  feature 
}) => (
  <UpgradeModal
    isOpen={isOpen}
    onClose={onClose}
    type="feature"
    feature={feature}
  />
); 

