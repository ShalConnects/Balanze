import React from 'react';
import { Edit2, Ticket, Trash2, Trophy } from 'lucide-react';
import type { PrizeBond } from '../../types/prizeBond';

export const PrizeBondIcon: React.FC<{ isWinner?: boolean; className?: string }> = ({
  isWinner,
  className = 'w-3 h-3',
}) =>
  isWinner ? (
    <Trophy className={`${className} shrink-0 text-amber-500`} aria-hidden />
  ) : (
    <Ticket className={`${className} shrink-0 text-gray-400 dark:text-gray-500`} aria-hidden />
  );

const chipBase =
  'group grid w-full min-w-[8.5rem] grid-cols-[1.75rem_1fr_1.75rem] items-center gap-0.5 px-1 py-1.5 rounded-md border font-mono text-[13px] tabular-nums shadow-sm transition-[box-shadow,border-color,background-color] hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/40';

const chipNormal =
  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20';

const chipWinner =
  'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 hover:border-amber-400 dark:hover:border-amber-600';

type Props = {
  bond: PrizeBond;
  isWinner?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopy?: () => void;
};

export const PrizeBondChip: React.FC<Props> = ({ bond, isWinner, onEdit, onDelete, onCopy }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bond.bond_number);
      onCopy?.();
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className={`${chipBase} ${isWinner ? chipWinner : chipNormal}`}>
      <span className="flex justify-center">
        <PrizeBondIcon isWinner={isWinner} />
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="min-w-0 truncate text-center"
        title={bond.bond_number}
      >
        {bond.bond_number}
      </button>
      <span className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button type="button" onClick={onEdit} className="rounded p-0.5 text-gray-500 hover:text-blue-600" aria-label="Edit">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onDelete} className="rounded p-0.5 text-gray-500 hover:text-red-600" aria-label="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </span>
    </div>
  );
};
