import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';

interface QuickPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPurchaseForm: React.FC<QuickPurchaseFormProps> = ({ isOpen, onClose }) => {
  const { addPurchase, purchaseCategories, accounts } = useFinanceStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    price: '',
    currency: 'USD',
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'planned' as 'planned' | 'purchased',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.status === 'purchased' && (!formData.price || parseFloat(formData.price) <= 0)) {
      newErrors.price = 'Valid price is required for purchased items';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      const purchaseData = {
        item_name: formData.item_name,
        category: formData.category,
        price: formData.status === 'planned' ? 0 : parseFloat(formData.price),
        purchase_date: formData.purchase_date,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes || '',
        currency: formData.currency
      };

      await addPurchase(purchaseData);
      toast.success('Purchase added successfully!');
      onClose();
      
      // Reset form
      setFormData({
        item_name: '',
        category: '',
        price: '',
        currency: 'USD',
        purchase_date: new Date().toISOString().split('T')[0],
        status: 'planned',
        priority: 'medium',
        notes: ''
      });
      setErrors({});
    } catch (error) {

      toast.error('Failed to add purchase. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-1 focus:border-gray-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 bg-white dark:bg-gray-700";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-300 dark:border-gray-600 focus:ring-gray-400";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800 p-5 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      Quick Add Purchase
                    </Dialog.Title>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add a new purchase quickly
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => {
                      setFormData({ ...formData, item_name: e.target.value });
                      if (errors.item_name) setErrors({ ...errors, item_name: '' });
                    }}
                    className={getInputClasses('item_name')}
                    placeholder="Enter item name"
                    required
                    aria-describedby={errors.item_name ? 'item-name-error' : undefined}
                  />
                  {errors.item_name && (
                    <p id="item-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.item_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (errors.category) setErrors({ ...errors, category: '' });
                    }}
                    className={getInputClasses('category')}
                    required
                    aria-describedby={errors.category ? 'category-error' : undefined}
                  >
                    <option value="">Select category</option>
                    {purchaseCategories.map((cat) => (
                      <option key={cat.id} value={cat.category_name}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p id="category-error" className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planned' | 'purchased' })}
                    className={getInputClasses('status')}
                  >
                    <option value="planned">Planned</option>
                    <option value="purchased">Purchased</option>
                  </select>
                </div>

                {formData.status === 'purchased' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        if (errors.price) setErrors({ ...errors, price: '' });
                      }}
                      className={getInputClasses('price')}
                      placeholder="0.00"
                      aria-describedby={errors.price ? 'price-error' : undefined}
                    />
                    {errors.price && (
                      <p id="price-error" className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.price}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className={getInputClasses('priority')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-[150px] border border-gray-200 dark:border-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <DatePicker
                      selected={formData.purchase_date ? parseISO(formData.purchase_date) : null}
                      onChange={date => setFormData({ ...formData, purchase_date: date ? date.toISOString().split('T')[0] : '' })}
                      placeholderText="Purchase date"
                      dateFormat="yyyy-MM-dd"
                      className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      calendarClassName="z-50 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg !font-sans bg-white dark:bg-gray-800"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? 'Adding...' : 'Add Purchase'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}; 

