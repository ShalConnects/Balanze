import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { fetchRecentItemCount } from '../../lib/expenseNoteService';

const headerBtnClass =
  'relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0';

export const ShoppingListNavButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    fetchRecentItemCount(user.id).then(setBadge).catch(() => setBadge(0));
  }, [user?.id]);

  return (
    <button
      type="button"
      onClick={() => navigate('/shopping-list')}
      className={`relative bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 h-8 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center ${className}`}
      title="Global shopping list"
      aria-label="Global shopping list"
    >
      <ShoppingBasket className="w-4 h-4" />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};
