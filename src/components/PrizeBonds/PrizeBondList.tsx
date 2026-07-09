import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { PrizeBond } from '../../types/prizeBond';
import { LP } from '../common/listPage/listPageLayout';
import { PrizeBondChip, PrizeBondIcon } from './PrizeBondChip';

type Props = {
  bonds: PrizeBond[];
  rowOffset?: number;
  winningBondIds?: Set<string>;
  emptyMessage: string;
  bondNumberLabel: string;
  actionsLabel: string;
  onEdit: (bond: PrizeBond) => void;
  onDelete: (id: string) => void;
  onCopyBond?: () => void;
};

const BondActions: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <span className="inline-flex items-center shrink-0">
    <button type="button" onClick={onEdit} className="p-1 text-gray-500 hover:text-blue-600" aria-label="Edit">
      <Edit2 className="w-4 h-4" />
    </button>
    <button type="button" onClick={onDelete} className="p-1 text-gray-500 hover:text-red-600" aria-label="Delete">
      <Trash2 className="w-4 h-4" />
    </button>
  </span>
);

export const PrizeBondList: React.FC<Props> = ({
  bonds,
  rowOffset = 0,
  winningBondIds,
  emptyMessage,
  bondNumberLabel,
  actionsLabel,
  onEdit,
  onDelete,
  onCopyBond,
}) => {
  if (!bonds.length) {
    return <p className="px-3 py-8 text-center text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <>
      <div className={`${LP.tableOuter} lg:hidden`}>
        <table className={LP.table}>
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{bondNumberLabel}</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">{actionsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond, i) => (
              <tr key={bond.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2 text-sm text-gray-500">{rowOffset + i + 1}</td>
                <td className="px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                  <span className="inline-flex items-center gap-1">
                    <PrizeBondIcon isWinner={winningBondIds?.has(bond.id)} className="w-3.5 h-3.5" />
                    {bond.bond_number}                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <BondActions onEdit={() => onEdit(bond)} onDelete={() => onDelete(bond.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hidden lg:grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2 px-3 pb-3 pt-0">
        {bonds.map((bond) => (
          <PrizeBondChip
            key={bond.id}
            bond={bond}
            isWinner={winningBondIds?.has(bond.id)}
            onEdit={() => onEdit(bond)}
            onDelete={() => onDelete(bond.id)}
            onCopy={onCopyBond}
          />
        ))}
      </div>
    </>
  );
};
