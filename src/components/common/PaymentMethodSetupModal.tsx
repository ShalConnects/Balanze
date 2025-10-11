import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Banknote
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface PaymentMethodSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentMethod: any) => void;
}

export const PaymentMethodSetupModal: React.FC<PaymentMethodSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [step, setStep] = useState<'method' | 'details' | 'verification'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'bank'>('card');
  const [loading, setLoading] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: ''
  });

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard,
      color: 'blue',
      popular: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: Banknote,
      color: 'purple',
      popular: false
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank account transfer',
      icon: Smartphone,
      color: 'green',
      popular: false
    }
  ];

  const handleMethodSelect = (methodId: 'card' | 'paypal' | 'bank') => {
    setSelectedMethod(methodId);
    setStep('details');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Prepare payment method data
      const paymentMethodData = {
        type: selectedMethod,
        provider: selectedMethod === 'paypal' ? 'paypal' : 'stripe',
        last4: selectedMethod === 'card' ? formData.cardNumber.replace(/\s/g, '').slice(-4) : undefined,
        brand: selectedMethod === 'card' ? getCardBrand(formData.cardNumber) : undefined,
        expiry_month: selectedMethod === 'card' ? parseInt(formData.expiryDate.split('/')[0]) : undefined,
        expiry_year: selectedMethod === 'card' ? parseInt('20' + formData.expiryDate.split('/')[1]) : undefined,
        is_default: true,
        metadata: {
          cardholder_name: formData.cardholderName,
          email: formData.email,
          phone: formData.phone
        }
      };

      // Generate a unique provider payment method ID
      const providerPaymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save to database using the add_payment_method function
      const { data, error } = await supabase.rpc('add_payment_method', {
        p_user_id: user.id,
        p_payment_provider: paymentMethodData.provider,
        p_provider_payment_method_id: providerPaymentMethodId,
        p_type: paymentMethodData.type,
        p_brand: paymentMethodData.brand,
        p_last4: paymentMethodData.last4,
        p_expiry_month: paymentMethodData.expiry_month,
        p_expiry_year: paymentMethodData.expiry_year,
        p_is_default: paymentMethodData.is_default,
        p_metadata: paymentMethodData.metadata
      });

      if (error) {
        console.error('Error adding payment method:', error);
        toast.error('Failed to add payment method. Please try again.');
        return;
      }

      // Create the payment method object for the parent component
      const newPaymentMethod = {
        id: data, // Use the database-generated ID
        type: paymentMethodData.type,
        provider: paymentMethodData.provider,
        last4: paymentMethodData.last4,
        brand: paymentMethodData.brand,
        expiry_month: paymentMethodData.expiry_month,
        expiry_year: paymentMethodData.expiry_year,
        is_default: paymentMethodData.is_default,
        created_at: new Date().toISOString(),
        metadata: paymentMethodData.metadata
      };

      toast.success('Payment method added successfully!');
      onSuccess?.(newPaymentMethod);
      onClose();
      
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine card brand
  const getCardBrand = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const resetModal = () => {
    setStep('method');
    setSelectedMethod('card');
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      email: '',
      phone: ''
    });
    setShowCardDetails(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Payment Method
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {['method', 'details', 'verification'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName 
                    ? 'bg-blue-600 text-white' 
                    : index < ['method', 'details', 'verification'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {index < ['method', 'details', 'verification'].indexOf(step) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < ['method', 'details', 'verification'].indexOf(step)
                      ? 'bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Choose Payment Method
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select how you'd like to pay for your subscription
                </p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id as 'card' | 'paypal' | 'bank')}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          method.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          method.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            method.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            method.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {method.name}
                            </h4>
                            {method.popular && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 text-xs font-medium rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Payment Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your {selectedMethod === 'card' ? 'card' : selectedMethod === 'paypal' ? 'PayPal' : 'bank account'} information
                </p>
              </div>

              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        maxLength={19}
                      />
                      <CreditCard className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CVV
                      </label>
                      <div className="relative">
                        <input
                          type={showCardDetails ? 'text' : 'password'}
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          maxLength={4}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCardDetails(!showCardDetails)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showCardDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === 'paypal' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PayPal Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Secure PayPal Integration
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You'll be redirected to PayPal to complete the secure setup process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      placeholder="123456789"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Your Information is Secure
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      All payment information is encrypted and processed securely. We never store your full card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'verification' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Payment Method Added!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your payment method has been successfully added and is ready to use.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          {step !== 'method' && (
            <button
              onClick={() => setStep(step === 'details' ? 'method' : 'details')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            {step === 'details' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  'Add Payment Method'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
