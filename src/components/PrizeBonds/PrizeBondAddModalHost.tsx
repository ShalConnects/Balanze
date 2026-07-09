import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { addPrizeBond, addPrizeBondsBulk, saveScanFeedback } from '../../lib/prizeBondService';
import type { PrizeBondScanFeedback } from '../../types/prizeBond';
import { PrizeBondAddModal } from './PrizeBondAddModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  initialNumber?: string;
};

export function PrizeBondAddModalHost({ open, onClose, onSuccess, initialNumber }: Props) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);

  const bondError = useCallback((e: unknown) => {
    const msg = (e as Error).message;
    toast.error(msg === 'DUPLICATE_BOND' ? t('prizeBond.duplicate') : t('prizeBond.invalidNumber'));
  }, [t]);

  const handleAdd = useCallback(async (raw: string) => {
    if (!userId) return;
    try {
      await addPrizeBond(userId, raw);
      toast.success(t('prizeBond.added'));
      await onSuccess?.();
    } catch (e) {
      bondError(e);
      throw e;
    }
  }, [userId, t, onSuccess, bondError]);

  const handleBulk = useCallback(async (raw: string) => {
    if (!userId) return;
    try {
      const { added, skipped } = await addPrizeBondsBulk(userId, raw);
      toast.success(t('prizeBond.bulkResult', { added, skipped }));
      await onSuccess?.();
    } catch {
      toast.error(t('prizeBond.bulkError'));
      throw new Error('BULK_FAIL');
    }
  }, [userId, t, onSuccess]);

  const handleScan = useCallback(async (feedback: PrizeBondScanFeedback) => {
    if (!userId) return;
    try {
      await addPrizeBond(userId, feedback.confirmed_number);
      await saveScanFeedback(userId, feedback);
      toast.success(t('prizeBond.added'));
      await onSuccess?.();
    } catch (e) {
      bondError(e);
      throw e;
    }
  }, [userId, t, onSuccess, bondError]);

  if (!userId) return null;

  return (
    <PrizeBondAddModal open={open} onClose={onClose} userId={userId} initialNumber={initialNumber}
      onAdd={handleAdd} onBulk={handleBulk} onScan={handleScan} />
  );
}
