import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { initializePayPal, createPayPalOrder, handlePayPalApproval } from '../../lib/paypal';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface PayPalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'one-time';
  features: string[];
}

export const PayPalPaymentModal: React.FC<PayPalPaymentModalProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  price,
  billingCycle,
  features
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPayPal();
    }
  }, [isOpen]);

  const loadPayPal = async () => {
    try {
      await initializePayPal();
      setPaypalLoaded(true);
    } catch (err) {
      console.error('Failed to load PayPal:', err);
      setError('Failed to load payment system. Please refresh and try again.');
    }
  };

  const handlePayPalPayment = async () => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create PayPal order
      const orderId = await createPayPalOrder(planId);
      
      // Initialize PayPal buttons
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: () => orderId,
          onApprove: async (data: any) => {
            try {
              // Capture the payment
              const result = await handlePayPalApproval(data.orderID, planId);
              
              if (result.success) {
                // Update user subscription in database
                const { error: dbError } = await supabase
                  .rpc('upgrade_user_subscription', {
                    user_uuid: user.id,
                    plan_name: 'premium',
                    payment_method: 'paypal'
                  });

                if (dbError) {
                  throw dbError;
                }

                toast.success('Payment successful! Your subscription has been upgraded.');
                onClose();
                
                // Refresh the page to show new features
                window.location.reload();
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (err) {
              console.error('Payment error:', err);
              setError('Payment failed. Please try again.');
              toast.error('Payment failed. Please try again.');
            } finally {
              setLoading(false);
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            setError('Payment failed. Please try again.');
            toast.error('Payment failed. Please try again.');
            setLoading(false);
          },
          onCancel: () => {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }).render('#paypal-button-container');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to initiate payment. Please try again.');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Upgrade to {planName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {planName} Plan
            </h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {formatPrice(price)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              per {billingCycle === 'one-time' ? 'lifetime' : 'month'}
            </div>
            {billingCycle === 'one-time' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  Buy it for lifetime access!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            What's included:
          </h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6">
          <div className="flex items-center">
            <Lock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Your payment is secured by PayPal. We never store your payment details.
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* PayPal Button Container */}
        <div className="mb-4">
          {!paypalLoaded ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Loading payment system...</span>
            </div>
          ) : (
            <div id="paypal-button-container"></div>
          )}
        </div>

        {/* Alternative Payment Methods */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Other payment methods coming soon:
          </p>
          <div className="flex justify-center gap-2">
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              bKash
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Nagad
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Rocket
            </span>
          </div>
        </div>

        {/* Trial Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Start with a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}; 