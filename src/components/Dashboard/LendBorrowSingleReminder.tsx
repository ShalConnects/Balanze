import React, { useEffect, useState } from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow } from '../../types/index';

const getTypeIcon = (type: LendBorrow['type']) => {
  return type === 'lend'
    ? <ArrowUpRight className="w-4 h-4 text-green-500" />
    : <ArrowDownLeft className="w-4 h-4 text-red-500" />;
};

const getDueInDays = (dueDate?: string) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const LendBorrowSingleReminder: React.FC = () => {
  const { user } = useAuthStore();
  const [reminder, setReminder] = useState<LendBorrow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return setLoading(false);
        // Filter for overdue and upcoming (active) only
        const reminders = data.filter(
          (r: LendBorrow) => r.status === 'overdue' || (r.status === 'active' && r.due_date)
        ).sort((a: LendBorrow, b: LendBorrow) => {
          // Overdue first, then by due date
          if (a.status === 'overdue' && b.status !== 'overdue') return -1;
          if (a.status !== 'overdue' && b.status === 'overdue') return 1;
          return (a.due_date || '').localeCompare(b.due_date || '');
        });
        setReminder(reminders[0] || null);
        setLoading(false);
      });
  }, [user]);

  if (loading) return null;
  if (!reminder) return null;

  const dueIn = getDueInDays(reminder.due_date);
  const typeText = reminder.type === 'lend' ? 'owes you' : 'you owe';
  const typeColor = reminder.type === 'lend' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
      <Clock className="w-5 h-5 text-blue-500 mr-2" />
      <div>
        <div className="font-semibold text-blue-800 flex items-center gap-2">
          Upcoming Lend & Borrow Reminder {getTypeIcon(reminder.type)}
        </div>
        <div className="text-sm text-blue-700 mt-1">
          {reminder.person_name} <span className={typeColor}>{typeText}</span> {reminder.amount} {reminder.currency}
          {reminder.due_date && dueIn !== null && (
            <> &mdash; due in {dueIn} {Math.abs(dueIn) === 1 ? 'day' : 'days'}</>
          )}
        </div>
      </div>
    </div>
  );
}; 

