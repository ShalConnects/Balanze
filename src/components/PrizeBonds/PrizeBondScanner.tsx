import React, { useState } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { scanBondImage } from '../../lib/prizeBondOcr';
import { fetchScanLearnHints } from '../../lib/prizeBondService';
import { normalizeBondNumber } from '../../lib/prizeBondUtils';
import { logBondScan } from '../../lib/prizeBondScanLog';
import { capturePhoto, isCancel, pickImage } from '../../lib/nativeFile';
import type { BondOcrResult, PrizeBondScanFeedback } from '../../types/prizeBond';

export const PRIZE_BOND_TOOLBAR_BTN = {
  primary: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md bg-gradient-primary text-white disabled:opacity-50',
  secondary: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50',
} as const;

type Props = {
  userId: string;
  onConfirmed: (feedback: PrizeBondScanFeedback) => void;
  disabled?: boolean;
  suffix?: React.ReactNode;
};

export const PrizeBondScanner: React.FC<Props> = ({ userId, onConfirmed, disabled, suffix }) => {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState<BondOcrResult | null>(null);
  const [value, setValue] = useState('');

  const processFile = async (file: File) => {
    setScanning(true);
    logBondScan('upload', { name: file.name, size: file.size });
    try {
      const hints = await fetchScanLearnHints(userId);
      const result = await scanBondImage(file, hints);
      if (!result.number || !result.feedback) {
        logBondScan('no-match');
        toast.error(t('prizeBond.scanError'));
        return;
      }
      setPending(result);
      setValue(result.number);
    } catch {
      toast.error(t('prizeBond.scanError'));
    } finally {
      setScanning(false);
    }
  };

  const confirm = () => {
    if (!pending?.feedback) return;
    const confirmed = normalizeBondNumber(value);
    if (!confirmed) {
      toast.error(t('prizeBond.invalidNumber'));
      return;
    }
    const feedback: PrizeBondScanFeedback = { ...pending.feedback, confirmed_number: confirmed };
    logBondScan('accepted', { detected: feedback.detected_number, confirmed });
    onConfirmed(feedback);
    setPending(null);
    setValue('');
  };

  const run = async (getFile: () => Promise<File>) => {
    try {
      await processFile(await getFile());
    } catch (e) {
      if (!isCancel(e)) {
        console.error('[PrizeBondScanner]', e);
        toast.error(t('prizeBond.scanFailed'));
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled || scanning} onClick={() => void run(capturePhoto)}
          className={PRIZE_BOND_TOOLBAR_BTN.primary}>
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {t('prizeBond.scan')}
        </button>
        <button type="button" disabled={disabled || scanning} onClick={() => void run(pickImage)}
          className={PRIZE_BOND_TOOLBAR_BTN.secondary}>
          <Upload className="w-4 h-4" />{t('prizeBond.upload')}
        </button>
        {suffix}
      </div>

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('prizeBond.scanConfirm')}</h3>
              <button type="button" onClick={() => setPending(null)}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('prizeBond.scanConfirmHint')}</p>
            <input value={value} onChange={(e) => setValue(e.target.value)} autoFocus
              className="w-full px-3 py-2 text-sm font-mono rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 mb-3" />
            <button type="button" onClick={confirm} className="w-full py-2 rounded-md bg-gradient-primary text-white text-sm">
              {t('prizeBond.scanConfirmAdd')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
