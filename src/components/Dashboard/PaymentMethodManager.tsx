import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  CreditCard as CardIcon,
  Banknote,
  Smartphone
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { PaymentMethodSetupModal } from '../common/PaymentMethodSetupModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  provider: 'stripe' | 'paypal';
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
  metadata?: any;
}

interface PaymentMethodManagerProps {
  hideTitle?: boolean;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ hideTitle = false }) => {
  const { user, profile } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<{ [key: string]: boolean }>({});
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    methodId: string;
    methodDetails: string;
  }>({
    isOpen: false,
    methodId: '',
    methodDetails: ''
  });

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {

        return;
      }

      // Fetch payment methods from database
      const { data, error } = await supabase.rpc('get_user_payment_methods', {
        p_user_id: user.id
      });

      if (error) {

        toast.error('Failed to load payment methods');
        return;
      }

      // Transform database data to component format
      const transformedMethods: PaymentMethod[] = (data || []).map((method: any) => ({
        id: method.id,
        type: method.type,
        provider: method.payment_provider,
        last4: method.last4,
        brand: method.brand,
        expiry_month: method.expiry_month,
        expiry_year: method.expiry_year,
        is_default: method.is_default,
        created_at: method.created_at,
        metadata: method.metadata
      }));

      setPaymentMethods(transformedMethods);
    } catch (error) {

      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {

    setShowAddMethod(true);
  };

  const handlePaymentMethodAdded = async (newPaymentMethod: any) => {
    try {
      if (!user?.id) {

        return;
      }

      // Save to database using the add_payment_method function
      const { data, error } = await supabase.rpc('add_payment_method', {
        p_user_id: user.id,
        p_payment_provider: newPaymentMethod.provider,
        p_provider_payment_method_id: newPaymentMethod.id,
        p_type: newPaymentMethod.type,
        p_brand: newPaymentMethod.brand,
        p_last4: newPaymentMethod.last4,
        p_expiry_month: newPaymentMethod.expiry_month,
        p_expiry_year: newPaymentMethod.expiry_year,
        p_is_default: newPaymentMethod.is_default,
        p_metadata: newPaymentMethod.metadata
      });

      if (error) {

        toast.error('Failed to add payment method');
        return;
      }

      // Reload payment methods to get the updated list
      await loadPaymentMethods();
      setShowAddMethod(false);
      toast.success('Payment method added successfully!');
    } catch (error) {

      toast.error('Failed to add payment method');
    }
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    const methodDetails = method ? 
      (method.type === 'card' 
        ? `${method.brand?.charAt(0).toUpperCase()}${method.brand?.slice(1)} •••• ${method.last4}`
        : method.type.charAt(0).toUpperCase() + method.type.slice(1)
      ) : 'this payment method';
    
    setDeleteModal({
      isOpen: true,
      methodId,
      methodDetails
    });
  };

  const confirmDeletePaymentMethod = async () => {
    try {
      if (!user?.id) {

        return;
      }

      // Delete from database using the delete_payment_method function
      const { error } = await supabase.rpc('delete_payment_method', {
        p_user_id: user.id,
        p_payment_method_id: deleteModal.methodId
      });

      if (error) {

        toast.error('Failed to delete payment method');
        return;
      }

      // Reload payment methods to get the updated list
      await loadPaymentMethods();
      toast.success('Payment method deleted successfully');
    } catch (error) {

      toast.error('Failed to delete payment method');
    } finally {
      setDeleteModal({
        isOpen: false,
        methodId: '',
        methodDetails: ''
      });
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      if (!user?.id) {

        return;
      }

      // Set default using the set_default_payment_method function
      const { error } = await supabase.rpc('set_default_payment_method', {
        p_user_id: user.id,
        p_payment_method_id: methodId
      });

      if (error) {

        toast.error('Failed to update default payment method');
        return;
      }

      // Reload payment methods to get the updated list
      await loadPaymentMethods();
      toast.success('Default payment method updated');
    } catch (error) {

      toast.error('Failed to update default payment method');
    }
  };

  const toggleCardDetails = (methodId: string) => {
    setShowCardDetails(prev => ({
      ...prev,
      [methodId]: !prev[methodId]
    }));
  };

  const getPaymentMethodIcon = (type: string, brand?: string) => {
    switch (type) {
      case 'card':
        return <CardIcon className="w-5 h-5" />;
      case 'paypal':
        return <Banknote className="w-5 h-5" />;
      case 'bank':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getBrandColor = (brand?: string) => {
    switch (brand) {
      case 'visa':
        return 'text-blue-600';
      case 'mastercard':
        return 'text-red-600';
      case 'amex':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Methods</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your payment methods for subscription billing
          </p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Secure Payment Processing
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your payment information is encrypted and securely stored. We never store your full card details.
            </p>
          </div>
        </div>
      </div>

      {/* Current Payment Methods */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saved Payment Methods
          </h3>
          <button
            onClick={handleAddPaymentMethod}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No payment methods added
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add a payment method to manage your subscription billing
            </p>
            <button
              onClick={handleAddPaymentMethod}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Payment Method
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  method.is_default 
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-900/10' 
                    : 'border-gray-200 dark:border-gray-700'
                } p-4 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      method.is_default 
                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {getPaymentMethodIcon(method.type, method.brand)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {method.type === 'card' ? (
                            <>
                              {method.brand?.charAt(0).toUpperCase()}{method.brand?.slice(1)} •••• {method.last4}
                            </>
                          ) : (
                            method.type.charAt(0).toUpperCase() + method.type.slice(1)
                          )}
                        </h4>
                        {method.is_default && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      
                      {method.type === 'card' && (
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Expires {formatExpiryDate(method.expiry_month, method.expiry_year)}
                          </span>
                          <button
                            onClick={() => toggleCardDetails(method.id)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {showCardDetails[method.id] ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                Show
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Added {new Date(method.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete payment method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Show card details if toggled */}
                {method.type === 'card' && showCardDetails[method.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Card Number:</span>
                        <div className="font-mono text-gray-900 dark:text-white">
                          •••• •••• •••• {method.last4}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Expiry:</span>
                        <div className="font-mono text-gray-900 dark:text-white">
                          {formatExpiryDate(method.expiry_month, method.expiry_year)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Billing Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Next Billing Date</h4>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {profile?.subscription?.plan === 'premium' 
                  ? (profile?.subscription?.billing_cycle === 'lifetime' 
                      ? 'No billing - Lifetime access' 
                      : profile?.subscription?.next_billing_date 
                        ? `Next billing: ${new Date(profile.subscription.next_billing_date).toLocaleDateString()}`
                        : 'Monthly billing on the 15th')
                  : 'No active subscription'
                }
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Plan</h4>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {profile?.subscription?.plan === 'premium' 
                  ? (profile?.subscription?.billing_cycle === 'lifetime' 
                      ? `Premium - Lifetime ($${profile?.subscription?.purchase_details?.amount_paid || '199.99'})` 
                      : `Premium - $${profile?.subscription?.purchase_details?.amount_paid || '7.99'}/month`)
                  : 'Free Plan'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Setup Modal */}
      <PaymentMethodSetupModal
        isOpen={showAddMethod}
        onClose={() => setShowAddMethod(false)}
        onSuccess={handlePaymentMethodAdded}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({
          isOpen: false,
          methodId: '',
          methodDetails: ''
        })}
        onConfirm={confirmDeletePaymentMethod}
        title="Delete Payment Method"
        message="Are you sure you want to delete this payment method? This action cannot be undone."
        recordDetails={
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Payment Method:</strong> {deleteModal.methodDetails}
          </div>
        }
        confirmLabel="Delete Payment Method"
        cancelLabel="Cancel"
      />
    </div>
  );
};

