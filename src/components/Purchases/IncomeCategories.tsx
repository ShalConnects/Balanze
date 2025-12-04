import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { CategoryModal } from '../common/CategoryModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { sortCategoriesByCurrency } from '../../utils/categoryFiltering';

interface IncomeCategoriesProps {
  hideTitle?: boolean;
}

export const IncomeCategories: React.FC<IncomeCategoriesProps> = ({ hideTitle = false }) => {
  const { categories, addCategory, updateCategory, deleteCategory, fetchCategories } = useFinanceStore();
  const { user } = useAuthStore();
  
  // Sort income categories by currency and then by name
  const incomeCategories = useMemo(() => {
    const filtered = categories.filter(cat => cat.type === 'income');
    return sortCategoriesByCurrency(filtered);
  }, [categories]);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  // Memoize fetch function to prevent infinite loops
  const fetchCategoriesCallback = useCallback(() => {
    useFinanceStore.getState().fetchCategories();
  }, []);

  // Fetch categories when component mounts
  useEffect(() => {
    if (user) {
      fetchCategoriesCallback();
    }
  }, [user, fetchCategoriesCallback]);

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: any) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        {!hideTitle && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Income Categories</h2>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>
      <CategoryModal
        open={showForm}
        initialValues={editingCategory ? {
          category_name: editingCategory.name,
          description: editingCategory.description || '',
          category_color: editingCategory.color || '#10B981',
          currency: editingCategory.currency || 'USD',
        } : {
          category_name: '',
          description: '',
          category_color: '#10B981',
          currency: '', // Will be set by CategoryModal based on user's profile
        }}
        isEdit={!!editingCategory}
        onSave={async (values) => {
          if (editingCategory) {
            await updateCategory(editingCategory.id, {
              name: values.category_name,
              type: 'income', // Explicitly preserve type as income
              color: values.category_color,
              description: values.description,
              currency: values.currency,
            });
            setEditingCategory(null);
          } else {
            await addCategory({
              name: values.category_name,
              type: 'income',
              color: values.category_color,
              icon: '',
              description: values.description,
              currency: values.currency,
            });
          }
          setShowForm(false);
        }}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        currencyOptions={['USD', 'BDT', 'EUR', 'GBP', 'JPY']}
        title={editingCategory ? "Edit Income Source" : "Add New Income Source"}
        isIncomeCategory={true}
      />
      {incomeCategories.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            // Group categories by currency
            const groupedCategories = incomeCategories.reduce((groups, category) => {
              const currency = category.currency || 'USD';
              if (!groups[currency]) {
                groups[currency] = [];
              }
              groups[currency].push(category);
              return groups;
            }, {} as Record<string, typeof incomeCategories>);

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
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-medium text-sm sm:text-[15px] text-gray-900 dark:text-white truncate">{category.name}</h3>
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
                <div className="text-[11px] sm:text-[12px] text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-1 line-clamp-2">{category.description}</div>
              )}
              <div className="text-[10px] sm:text-xs">
                <span className="text-gray-600 dark:text-gray-300">Currency: </span>
                <span className="font-medium text-gray-900 dark:text-white">{category.currency || 'USD'}</span>
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
            Create your first income category to start organizing your income.
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
        title="Delete Income Category"
        message={`Are you sure you want to delete ${categoryToDelete?.name}? This will remove the category from all income transactions.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800">Category Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Name:</span> {categoryToDelete?.name}</div>
              <div><span className="font-medium">Type:</span> Income</div>
              <div><span className="font-medium">Currency:</span> {categoryToDelete?.currency || 'USD'}</div>
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

