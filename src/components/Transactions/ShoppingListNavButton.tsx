import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { fetchDueShoppingCount } from '../../lib/expenseNoteService';

const VARIANT_CLASS = {
  header:
    'relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0',
  toolbar:
    'relative bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 h-8 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0',
} as const;

export const ShoppingListNavButton: React.FC<{ className?: string; variant?: keyof typeof VARIANT_CLASS }> = ({
  className = '',
  variant = 'header',
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    fetchDueShoppingCount(user.id).then(setBadge).catch(() => setBadge(0));
  }, [user?.id]);

  return (
    <button
      type="button"
      onClick={() => navigate('/shopping-list')}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      title="Shopping list"
      aria-label="Shopping list"
    >
      <ShoppingBasket
        className={variant === 'header' ? 'w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300' : 'w-4 h-4'}
      />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};
