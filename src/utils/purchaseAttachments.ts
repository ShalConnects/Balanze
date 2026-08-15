import { supabase } from '../lib/supabase';
import { PurchaseAttachment } from '../types';

export async function persistTempPurchaseAttachments(
  purchaseId: string,
  attachments: PurchaseAttachment[],
  userId: string,
) {
  if (!purchaseId || !userId) return;
  for (const att of attachments) {
    if (!att.id?.startsWith('temp_') || !att.file) continue;
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(`purchases/${purchaseId}/${att.file_name}`, att.file, { upsert: true });
    if (error || !data?.path) continue;
    const { publicUrl } = supabase.storage.from('attachments').getPublicUrl(data.path).data;
    await supabase.from('purchase_attachments').insert({
      purchase_id: purchaseId,
      user_id: userId,
      file_name: att.file_name,
      file_path: publicUrl,
      file_size: att.file_size,
      file_type: att.file_type,
      mime_type: att.mime_type,
      created_at: new Date().toISOString(),
    });
  }
}
