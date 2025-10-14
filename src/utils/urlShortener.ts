import { supabase } from '../lib/supabase';

// Generate a short code for URL shortening
export const generateShortCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a shortened URL for an attachment
export const createShortUrl = async (originalUrl: string, fileName: string, purchaseId: string): Promise<string> => {
  try {
    const shortCode = generateShortCode();
    
    // Store the mapping in database
    const { error } = await supabase
      .from('url_shortener')
      .insert({
        short_code: shortCode,
        original_url: originalUrl,
        file_name: fileName,
        purchase_id: purchaseId,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });

    if (error) {

      return originalUrl; // Fallback to original URL
    }

    // Return the shortened URL
    return `${window.location.origin}/f/${shortCode}`;
  } catch (error) {

    return originalUrl; // Fallback to original URL
  }
};

// Resolve a short URL to the original URL
export const resolveShortUrl = async (shortCode: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('url_shortener')
      .select('original_url')
      .eq('short_code', shortCode)
      .single();

    if (error || !data) {

      return null;
    }

    return data.original_url;
  } catch (error) {

    return null;
  }
};

// Generate a friendly file name for attachments
export const generateFriendlyFileName = (
  purchase: { item_name: string; category: string; purchase_date: string },
  originalFile: File
): string => {
  // Clean the item name and category
  const cleanItemName = purchase.item_name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  const cleanCategory = purchase.category
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);

  // Format date as YYYY-MM-DD
  const date = new Date(purchase.purchase_date).toISOString().split('T')[0];
  
  // Get file extension
  const extension = originalFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Create friendly filename
  const friendlyName = `${cleanCategory}-${cleanItemName}-${date}.${extension}`;
  
  return friendlyName;
};

// Generate a friendly storage path
export const generateFriendlyStoragePath = (
  purchase: { id: string; item_name: string; category: string; purchase_date: string },
  originalFile: File
): string => {
  const friendlyFileName = generateFriendlyFileName(purchase, originalFile);
  return `purchases/${purchase.id}/${friendlyFileName}`;
};

