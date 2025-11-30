import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, DollarSign, Palette } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PurchaseCategory } from '../../types';
import { CategoryModal } from '../common/CategoryModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import { sortPurchaseCategoriesByCurrency } from '../../utils/categoryFiltering';
import { showToast } from '../../lib/toast';

interface PurchaseCategoriesProps {
  hideTitle?: boolean;
}

export const PurchaseCategories: React.FC<PurchaseCategoriesProps> = ({ hideTitle = false }) => {
  const { 
    purchaseCategories, 
    loading, 
    error, 
    fetchPurchaseCategories, 
    addPurchaseCategory, 
    updatePurchaseCategory, 
    deletePurchaseCategory 
  } = useFinanceStore();
  const { user } = useAuthStore();

  // Sort purchase categories by currency and then by name
  const sortedPurchaseCategories = useMemo(() => {
    return sortPurchaseCategoriesByCurrency(purchaseCategories);
  }, [purchaseCategories]);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PurchaseCategory | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    monthly_budget: 0,
    currency: 'USD',
    category_color: '#3B82F6'
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<PurchaseCategory | null>(null);

  // Memoize fetch function to prevent infinite loops
  const fetchPurchaseCategoriesCallback = useCallback(() => {
    useFinanceStore.getState().fetchPurchaseCategories();
  }, []);

  // Fetch purchase categories when component mounts
  useEffect(() => {
    if (user) {
      fetchPurchaseCategoriesCallback();
    }
  }, [user, fetchPurchaseCategoriesCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updatePurchaseCategory(editingCategory.id, formData);
        setEditingCategory(null);
        showToast.success('Category updated successfully');
      } else {
        await addPurchaseCategory(formData);
        showToast.success('Category added successfully');
      }
      
      setFormData({
        category_name: '',
        description: '',
        monthly_budget: 0,
        currency: 'USD',
        category_color: '#3B82F6'
      });
      setShowForm(false);
    } catch (error) {
      showToast.error(editingCategory ? 'Failed to update category' : 'Failed to add category');
    }
  };

  const handleEdit = (category: PurchaseCategory) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || '',
      monthly_budget: category.monthly_budget,
      currency: category.currency,
      category_color: category.category_color
    });
    setShowForm(true);
  };

  const handleDelete = (category: PurchaseCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deletePurchaseCategory(categoryToDelete.id);
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        showToast.success('Category deleted successfully');
      } catch (error) {
        showToast.error('Failed to delete category');
      }
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return <div className="min-h-[200px] flex items-center justify-center text-lg text-gray-900 dark:text-white">Loading categories...</div>;
  }

  if (error) {
    return <div className="min-h-[200px] flex items-center justify-center text-red-600 dark:text-red-400 text-lg">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        {!hideTitle && (
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Purchase Categories</h2>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Categories you create here will be available for both expenses and transactions.
            </div>
          </div>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      <CategoryModal
        open={showForm}
        initialValues={editingCategory ? editingCategory : {
          category_name: '',
          description: '',
          monthly_budget: 0,
          currency: '', // Will be set by CategoryModal based on user's profile
          category_color: '#3B82F6',
        }}
        isEdit={!!editingCategory}
        onSave={async (values) => {
          if (editingCategory) {
            await updatePurchaseCategory(editingCategory.id, values);
            setEditingCategory(null);
            // Refresh categories after update
            await fetchPurchaseCategories();
          } else {
            await addPurchaseCategory({
              ...values,
              currency: values.currency || 'USD',
              monthly_budget: values.monthly_budget ?? 0,
              category_color: values.category_color || '#3B82F6',
            });
          }
          setShowForm(false);
        }}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? "Edit Expense Category" : "Add New Expense Category"}
      />

      {sortedPurchaseCategories.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            // Group categories by currency
            const groupedCategories = sortedPurchaseCategories.reduce((groups, category) => {
              const currency = category.currency || 'USD';
              if (!groups[currency]) {
                groups[currency] = [];
              }
              groups[currency].push(category);
              return groups;
            }, {} as Record<string, typeof sortedPurchaseCategories>);

            return Object.entries(groupedCategories).map(([currency, categories]) => (
              <div key={currency} className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {currency} Categories
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3 hover:shadow transition-shadow min-h-[80px]"
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.category_color }}
                  />
                  <h3 className="font-medium text-sm sm:text-[15px] text-gray-900 dark:text-white truncate">{category.category_name}</h3>
                </div>
                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 sm:p-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    aria-label="Edit category"
                  >
                    <Edit className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-1 sm:p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="text-[11px] sm:text-[12px] text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-1 line-clamp-1">{category.description}</p>
              )}

              <div className="text-[10px] sm:text-xs">
                <span className="text-gray-600 dark:text-gray-300">Budget: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(category.monthly_budget, category.currency)}
                </span>
              </div>
            </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 px-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-1">No categories yet</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 px-2">
            Create your first purchase category to start organizing your purchases.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!categoryToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Expense Category"
        message={`Are you sure you want to delete ${categoryToDelete?.category_name}? This will also delete all purchases in this category.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800">Category Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Name:</span> {categoryToDelete?.category_name}</div>
              <div><span className="font-medium">Type:</span> Expense</div>
              <div><span className="font-medium">Budget:</span> {categoryToDelete ? formatCurrency(categoryToDelete.monthly_budget, categoryToDelete.currency) : ''}</div>
              {categoryToDelete?.description && (
                <div><span className="font-medium">Description:</span> {categoryToDelete.description}</div>
              )}
            </div>
          </>
        }
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
      />
    </div>
  );
}; 

