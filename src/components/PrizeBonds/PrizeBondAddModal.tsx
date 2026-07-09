import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PrizeBondScanner, PRIZE_BOND_TOOLBAR_BTN } from './PrizeBondScanner';
import type { PrizeBondScanFeedback } from '../../types/prizeBond';

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdd: (number: string) => Promise<void>;
  onBulk: (text: string) => Promise<void>;
  onScan: (feedback: PrizeBondScanFeedback) => Promise<void>;
  initialNumber?: string;
};

export const PrizeBondAddModal: React.FC<Props> = ({ open, onClose, userId, onAdd, onBulk, onScan, initialNumber }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [bulk, setBulk] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setInput('');
      setBulk('');
      setShowBulk(false);
      setBusy(false);
    } else if (initialNumber) {
      setInput(initialNumber);
    }
  }, [open, initialNumber]);

  if (!open) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('prizeBond.addBond')}</h3>
          <button type="button" onClick={onClose} disabled={busy}><X className="w-4 h-4" /></button>
        </div>

        {!showBulk ? (
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy}
              placeholder={t('prizeBond.numberPlaceholder')} autoFocus
              className="flex-1 min-w-[140px] px-3 py-1.5 text-[13px] rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" />
            <button type="button" disabled={busy || !input.trim()} onClick={() => void run(() => onAdd(input))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md bg-gradient-primary text-white disabled:opacity-50">
              <Plus className="w-4 h-4" />{t('prizeBond.add')}
            </button>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} disabled={busy}
              placeholder={t('prizeBond.bulkPlaceholder')} autoFocus
              className="w-full px-3 py-2 text-[13px] rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" />
            <button type="button" disabled={busy || !bulk.trim()} onClick={() => void run(() => onBulk(bulk))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md bg-gradient-primary text-white disabled:opacity-50">
              {t('prizeBond.import')}
            </button>
          </div>
        )}

        <PrizeBondScanner userId={userId} disabled={busy} onConfirmed={(f) => void run(() => onScan(f))}
          suffix={(
            <button type="button" onClick={() => setShowBulk((v) => !v)} disabled={busy}
              className={PRIZE_BOND_TOOLBAR_BTN.secondary}>
              {showBulk ? t('prizeBond.single') : t('prizeBond.bulkImport')}
            </button>
          )} />
      </div>
    </div>
  );
};
