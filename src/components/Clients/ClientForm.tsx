import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Client, ClientInput } from '../../types/client';
import { Loader } from '../common/Loader';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import { format, parseISO } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, client }) => {
  const { addClient, updateClient, loading, error, clients } = useClientStore();
  const { isMobile } = useMobileDetection();
  const { canCreateClient, usageStats, getUpgradeMessage, loadUsageStats } = usePlanFeatures();
  const [formData, setFormData] = useState<ClientInput>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    company_name: '',
    tax_id: '',
    website: '',
    source: '',
    known_since: '',
    status: 'active',
    default_currency: 'USD',
    tags: [],
    notes: '',
    custom_fields: {}
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);

  // Common tag suggestions
  const commonTags = [
    'Fiverr',
    'Upwork',
    'Freelancer',
    'Premium',
    'Long-term',
    'One-time',
    'Referral',
    'Website',
    'Social Media',
    'Repeat Client',
    'VIP',
    'Corporate'
  ];

  // Currency options
  const currencyOptions = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'BDT - Bangladeshi Taka', value: 'BDT' },
    { label: 'INR - Indian Rupee', value: 'INR' },
    { label: 'JPY - Japanese Yen', value: 'JPY' },
    { label: 'CAD - Canadian Dollar', value: 'CAD' },
    { label: 'AUD - Australian Dollar', value: 'AUD' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Archived', value: 'archived' },
  ];

  const sourceOptions = [
    { label: 'Select Source', value: '' },
    { label: 'Fiverr', value: 'Fiverr' },
    { label: 'Upwork', value: 'Upwork' },
    { label: 'Freelancer', value: 'Freelancer' },
    { label: 'Referral', value: 'Referral' },
    { label: 'Website', value: 'Website' },
    { label: 'Social Media', value: 'Social Media' },
    { label: 'Direct', value: 'Direct' },
    { label: 'Other', value: 'Other' },
  ];

  // Country options - common countries
  const countryOptions = [
    { label: 'United States', value: 'United States' },
    { label: 'United Kingdom', value: 'United Kingdom' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Australia', value: 'Australia' },
    { label: 'Germany', value: 'Germany' },
    { label: 'France', value: 'France' },
    { label: 'Italy', value: 'Italy' },
    { label: 'Spain', value: 'Spain' },
    { label: 'Netherlands', value: 'Netherlands' },
    { label: 'Belgium', value: 'Belgium' },
    { label: 'Switzerland', value: 'Switzerland' },
    { label: 'Austria', value: 'Austria' },
    { label: 'Sweden', value: 'Sweden' },
    { label: 'Norway', value: 'Norway' },
    { label: 'Denmark', value: 'Denmark' },
    { label: 'Finland', value: 'Finland' },
    { label: 'Poland', value: 'Poland' },
    { label: 'Portugal', value: 'Portugal' },
    { label: 'Greece', value: 'Greece' },
    { label: 'Ireland', value: 'Ireland' },
    { label: 'Japan', value: 'Japan' },
    { label: 'South Korea', value: 'South Korea' },
    { label: 'China', value: 'China' },
    { label: 'India', value: 'India' },
    { label: 'Bangladesh', value: 'Bangladesh' },
    { label: 'Pakistan', value: 'Pakistan' },
    { label: 'Singapore', value: 'Singapore' },
    { label: 'Malaysia', value: 'Malaysia' },
    { label: 'Thailand', value: 'Thailand' },
    { label: 'Indonesia', value: 'Indonesia' },
    { label: 'Philippines', value: 'Philippines' },
    { label: 'Vietnam', value: 'Vietnam' },
    { label: 'United Arab Emirates', value: 'United Arab Emirates' },
    { label: 'Saudi Arabia', value: 'Saudi Arabia' },
    { label: 'Turkey', value: 'Turkey' },
    { label: 'Russia', value: 'Russia' },
    { label: 'Brazil', value: 'Brazil' },
    { label: 'Mexico', value: 'Mexico' },
    { label: 'Argentina', value: 'Argentina' },
    { label: 'Chile', value: 'Chile' },
    { label: 'Colombia', value: 'Colombia' },
    { label: 'South Africa', value: 'South Africa' },
    { label: 'Egypt', value: 'Egypt' },
    { label: 'Nigeria', value: 'Nigeria' },
    { label: 'Kenya', value: 'Kenya' },
    { label: 'New Zealand', value: 'New Zealand' },
  ];

  // Input classes helper - matching TransactionForm style
  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = touched[fieldName] && errors[fieldName] 
      ? "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600" 
      : "border-gray-200 focus:ring-blue-500";
    return `${baseClasses} ${errorClasses}`;
  };

  // Validation
  const validateField = (fieldName: string, value: any) => {
    let error = '';
    
    switch (fieldName) {
      case 'name':
        if (!value || !value.trim()) {
          error = 'Client name is required';
        }
        break;
      case 'email':
        if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'website':
        if (value && value.trim() && !/^https?:\/\/.+/.test(value)) {
          error = 'Please enter a valid URL (starting with http:// or https://)';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName as keyof ClientInput]);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  };

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        country: client.country || '',
        company_name: client.company_name || '',
        tax_id: client.tax_id || '',
        website: client.website || '',
        source: client.source || '',
        known_since: client.known_since || '',
        status: client.status,
        default_currency: client.default_currency || 'USD',
        tags: client.tags || [],
        notes: client.notes || '',
        custom_fields: client.custom_fields || {}
      });
    } else {
      // Reset form for new client
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        company_name: '',
        tax_id: '',
        website: '',
        source: '',
        known_since: '',
        status: 'active',
        default_currency: 'USD',
        tags: [],
        notes: '',
        custom_fields: {}
      });
    }
    setTagInput('');
    setShowTagSuggestions(false);
  }, [client, isOpen]);

  // Close tag suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagSuggestionsRef.current && !tagSuggestionsRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    }
    if (showTagSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagSuggestions]);


  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || tagInput.trim();
    if (tagToAdd && !formData.tags?.includes(tagToAdd)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagToAdd]
      }));
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  // Get filtered suggestions (exclude already added tags)
  const getFilteredSuggestions = () => {
    return commonTags.filter(tag => 
      !formData.tags?.includes(tag) &&
      tag.toLowerCase().includes(tagInput.toLowerCase())
    );
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['name', 'email', 'website'];
    allFields.forEach(field => {
      setTouched(prev => ({ ...prev, [field]: true }));
    });

    // Validate all fields
    const isValid = allFields.every(field => {
      return validateField(field, formData[field as keyof ClientInput]);
    });

    if (!isValid || !formData.name.trim()) {
      return;
    }

    // Check client limit for new clients only
    if (!client && !canCreateClient()) {
      const currentCount = clients.length;
      const limit = usageStats?.clients?.limit ?? 5;
      toast.error(`Client limit exceeded! You have ${currentCount}/${limit} clients. Upgrade to Premium for unlimited clients.`);
      setTimeout(() => {
        window.location.href = '/settings?tab=plans-usage';
      }, 2000);
      return;
    }

    try {
      if (client) {
        await updateClient(client.id, formData);
      } else {
        await addClient(formData);
        // Refresh usage stats after adding a client to update the limit display
        await loadUsageStats();
      }
      onClose();
    } catch (error) {
      // Check if it's a client limit error
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message;
        
        if (errorMessage && errorMessage.includes('CLIENT_LIMIT_EXCEEDED')) {
          const currentCount = clients.length;
          const limit = usageStats?.clients?.limit ?? 5;
          toast.error(`Client limit exceeded! You have ${currentCount}/${limit} clients. Upgrade to Premium for unlimited clients.`);
          setTimeout(() => {
            window.location.href = '/settings?tab=plans-usage';
          }, 2000);
          return;
        }
      }
      
      toast.error('Failed to save client. Please try again.');
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    // Reset form state only if not editing
    if (!client) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        company_name: '',
        tax_id: '',
        website: '',
        source: '',
        status: 'active',
        default_currency: 'USD',
        tags: [],
        notes: '',
        custom_fields: {}
      });
      setErrors({});
      setTouched({});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Loader isLoading={loading} message={client ? 'Updating client...' : 'Creating client...'} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        <div 
          data-tour="client-form"
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {client ? 'Edit Client' : 'Add New Client'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              disabled={loading}
              aria-label="Close form"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1">
            {/* Grid: All Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1.15rem] gap-y-[1.20rem] sm:gap-y-[1.40rem]">
              {/* Client Name */}
              <div className="relative sm:col-span-2">
                <input
                  id="client-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={getInputClasses('name')}
                  placeholder="Client Name *"
                  disabled={loading}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                />
                {touched.name && errors.name && (
                  <span id="name-error" className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  id="client-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={getInputClasses('email')}
                  placeholder="Email"
                  disabled={loading}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
                {touched.email && errors.email && (
                  <span id="email-error" className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="relative">
                <input
                  id="client-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={getInputClasses('phone')}
                  placeholder="Phone"
                  disabled={loading}
                />
              </div>

              {/* Company Name */}
              <div className="relative">
                <input
                  id="client-company"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleFieldChange('company_name', e.target.value)}
                  className={getInputClasses('company_name')}
                  placeholder="Company Name"
                  disabled={loading}
                />
              </div>

              {/* Tax ID */}
              <div className="relative">
                <input
                  id="client-tax-id"
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => handleFieldChange('tax_id', e.target.value)}
                  className={getInputClasses('tax_id')}
                  placeholder="Tax ID"
                  disabled={loading}
                />
              </div>

              {/* Website */}
              <div className="relative sm:col-span-2">
                <input
                  id="client-website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  onBlur={() => handleBlur('website')}
                  className={getInputClasses('website')}
                  placeholder="Website"
                  disabled={loading}
                  aria-describedby={errors.website ? 'website-error' : undefined}
                  aria-invalid={!!errors.website}
                />
                {touched.website && errors.website && (
                  <span id="website-error" className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.website}
                  </span>
                )}
              </div>

              {/* Street Address */}
              <div className="relative">
                <input
                  id="client-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className={getInputClasses('address')}
                  placeholder="Street Address"
                  disabled={loading}
                />
              </div>
              {/* City */}
              <div className="relative">
                <input
                  id="client-city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className={getInputClasses('city')}
                  placeholder="City"
                  disabled={loading}
                />
              </div>
              {/* State */}
              <div className="relative">
                <input
                  id="client-state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className={getInputClasses('state')}
                  placeholder="State/Province"
                  disabled={loading}
                />
              </div>

              {/* Postal Code */}
              <div className="relative">
                <input
                  id="client-postal"
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                  className={getInputClasses('postal_code')}
                  placeholder="Postal Code"
                  disabled={loading}
                />
              </div>
              {/* Country */}
              <div className="relative">
                <CustomDropdown
                  options={countryOptions}
                  value={formData.country || ''}
                  onChange={(value) => handleFieldChange('country', value)}
                  placeholder="Country"
                  disabled={loading}
                  fullWidth={true}
                />
              </div>

              {/* Source */}
              <div className="relative">
                <CustomDropdown
                  options={sourceOptions}
                  value={formData.source || ''}
                  onChange={(value) => handleFieldChange('source', value)}
                  placeholder="Source"
                  disabled={loading}
                  fullWidth={true}
                />
              </div>

              {/* Known Since */}
              <div className="relative">
                <div className={`${getInputClasses('known_since')} flex items-center px-4 pr-[10px]`}>
                  <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <DatePicker
                    selected={formData.known_since ? parseISO(formData.known_since) : null}
                    onChange={(date) => {
                      handleFieldChange('known_since', date ? format(date, 'yyyy-MM-dd') : '');
                    }}
                    onBlur={() => handleBlur('known_since')}
                    placeholderText="Known Since"
                    dateFormat="yyyy-MM-dd"
                    className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                    calendarClassName="z-[60] shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg !font-sans bg-white dark:bg-gray-800"
                    popperPlacement="bottom-start"
                    showPopperArrow={false}
                    wrapperClassName="w-full"
                    todayButton="Today"
                    highlightDates={[new Date()]}
                    isClearable
                    autoComplete="off"
                    disabled={loading}
                  />
                  {formData.known_since && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('known_since', '')}
                      className="ml-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      tabIndex={-1}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="relative">
                <CustomDropdown
                  options={statusOptions}
                  value={formData.status}
                  onChange={(value) => handleFieldChange('status', value)}
                  placeholder="Status"
                  disabled={loading}
                  fullWidth={true}
                />
              </div>

              {/* Currency */}
              <div className="relative">
                <CustomDropdown
                  options={currencyOptions}
                  value={formData.default_currency}
                  onChange={(value) => handleFieldChange('default_currency', value)}
                  placeholder="Default Currency"
                  disabled={loading}
                  fullWidth={true}
                />
              </div>

              {/* Tags */}
              <div className="relative sm:col-span-2" ref={tagSuggestionsRef}>
                <div className="flex gap-2 mb-2">
                  <input
                    id="client-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className={getInputClasses('tags')}
                    placeholder="Tags (e.g., 'Fiverr', 'Premium', 'Long-term')"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-10 flex-shrink-0"
                    disabled={loading || !tagInput.trim()}
                  >
                    Add
                  </button>
                </div>
                
                {/* Tag Suggestions */}
                {showTagSuggestions && getFilteredSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Suggestions:</div>
                      <div className="flex flex-wrap gap-2">
                        {getFilteredSuggestions().map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddTag(tag)}
                            className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            disabled={loading}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Display Tags */}
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full p-0.5"
                          disabled={loading}
                          aria-label={`Remove ${tag} tag`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="relative sm:col-span-2">
                <textarea
                  id="client-notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className={getInputClasses('notes') + ' min-h-[80px]'}
                  placeholder="Notes"
                  rows={3}
                  disabled={loading}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.notes.length}/500 characters
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-5">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] text-sm sm:text-base"
                disabled={loading || Object.keys(errors).filter(key => errors[key] && errors[key].trim() !== '').length > 0 || !formData.name.trim()}
              >
                {client ? 'Update Client' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

