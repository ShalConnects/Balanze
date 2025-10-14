import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow } from '../../types/index';

const getStatusColor = (status: LendBorrow['status']) => {
  switch (status) {
    case 'overdue': return 'bg-orange-100 text-orange-800';
    case 'active': return 'bg-blue-100 text-blue-800';
    case 'settled': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: LendBorrow['status']) => {
  switch (status) {
    case 'overdue': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'active': return <Clock className="w-4 h-4 text-blue-500" />;
    case 'settled': return <CheckCircle className="w-4 h-4 text-green-500" />;
    default: return null;
  }
};

const getTypeIcon = (type: LendBorrow['type']) => {
  return type === 'lend'
    ? <ArrowUpRight className="w-4 h-4 text-green-500" />
    : <ArrowDownLeft className="w-4 h-4 text-red-500" />;
};

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const LendBorrowReminders: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<LendBorrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
      .then(({ data }) => {
        setRecords(data || []);
        setLoading(false);
      });
  }, [user]);

  // Filter for overdue and upcoming (active) only
  const reminders = records.filter(
    r => r.status === 'overdue' || (r.status === 'active' && r.due_date)
  ).sort((a, b) => {
    // Overdue first, then by due date
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return (a.due_date || '').localeCompare(b.due_date || '');
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">Lend & Borrow Reminders</span>
        </div>
        <button className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No upcoming or overdue lend/borrow reminders.</div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {reminders.map(reminder => (
            <li key={reminder.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {getTypeIcon(reminder.type)}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {reminder.person_name} {reminder.type === 'lend' ? 'owes you' : 'you owe'}
                    <span className={reminder.type === 'lend' ? 'text-green-600' : 'text-red-600'}> {reminder.amount} {reminder.currency}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Due: {formatDate(reminder.due_date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                  {getStatusIcon(reminder.status)}
                  <span className="ml-1 capitalize">{reminder.status}</span>
                </span>
                <button className="text-xs text-blue-600 hover:underline">Mark as Done</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 

