import React, { useEffect, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { fetchDueShoppingCount } from '../../lib/expenseNoteService';
import {
  getShoppingDueCount,
  subscribeShoppingDueCount,
} from '../../utils/shoppingListCache';

export const ShoppingListNavButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const badge = useSyncExternalStore(subscribeShoppingDueCount, getShoppingDueCount, () => 0);

  useEffect(() => {
    if (!user?.id) return;
    fetchDueShoppingCount(user.id).catch(() => {});
  }, [user?.id]);

  return (
    <button
      type="button"
      onClick={() => navigate('/shopping-list')}
      className={`relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0 ${className}`}
      title="Shopping list"
      aria-label={badge > 0 ? `Shopping list, ${badge} due` : 'Shopping list'}
    >
      <ShoppingBasket className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};
