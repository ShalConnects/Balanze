import { supabase } from '../lib/supabase';

interface AttachmentRecord {
  id: string;
  purchase_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  created_at: string;
}

// Generate random filename (5-7 characters)
const generateRandomFileName = (originalExtension: string): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 3) + 5; // Random length between 5-7
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result + originalExtension;
};

// Extract storage path from public URL
const getStoragePathFromUrl = (publicUrl: string): string | null => {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    // Remove /storage/v1/object/public/attachments/ prefix
    const attachmentsIndex = pathParts.indexOf('attachments');
    if (attachmentsIndex !== -1 && attachmentsIndex < pathParts.length - 1) {
      return pathParts.slice(attachmentsIndex + 1).join('/');
    }
    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};

// Rename a single file in Supabase storage
const renameFileInStorage = async (
  oldPath: string, 
  newPath: string
): Promise<boolean> => {
  try {
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('attachments')
      .download(oldPath);

    if (downloadError || !fileData) {
      console.error(`Error downloading file ${oldPath}:`, downloadError);
      return false;
    }

    // Upload with new name
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(newPath, fileData, { upsert: true });

    if (uploadError) {
      console.error(`Error uploading file ${newPath}:`, uploadError);
      return false;
    }

    // Delete old file
    const { error: deleteError } = await supabase.storage
      .from('attachments')
      .remove([oldPath]);

    if (deleteError) {
      console.error(`Error deleting old file ${oldPath}:`, deleteError);
      // Don't return false here - the new file exists, old one can be cleaned up later
    }

    return true;
  } catch (error) {
    console.error('Error in renameFileInStorage:', error);
    return false;
  }
};

// Update database record with new file name and path
const updateDatabaseRecord = async (
  attachmentId: string,
  newFileName: string,
  newFileType: string,
  newPublicUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('purchase_attachments')
      .update({
        file_name: newFileName,
        file_type: newFileType,
        file_path: newPublicUrl
      })
      .eq('id', attachmentId);

    if (error) {
      console.error(`Error updating database record ${attachmentId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateDatabaseRecord:', error);
    return false;
  }
};

// Main function to rename all existing files
export const renameAllExistingFiles = async (userId?: string): Promise<{
  success: number;
  failed: number;
  total: number;
  errors: string[];
}> => {
  const results = {
    success: 0,
    failed: 0,
    total: 0,
    errors: [] as string[]
  };

  try {
    // Get all purchase attachments for the user (or all if no userId provided)
    let query = supabase.from('purchase_attachments').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: attachments, error: fetchError } = await query;

    if (fetchError) {
      results.errors.push(`Error fetching attachments: ${fetchError.message}`);
      return results;
    }

    if (!attachments || attachments.length === 0) {
      console.log('No attachments found to rename');
      return results;
    }

    results.total = attachments.length;
    console.log(`Found ${results.total} attachments to rename`);

    // Process each attachment
    for (const attachment of attachments as AttachmentRecord[]) {
      try {
        console.log(`Processing attachment: ${attachment.file_name}`);

        // Get original extension
        const originalExtension = '.' + (attachment.file_name.split('.').pop() || '');
        
        // Generate new random filename
        const newFileName = generateRandomFileName(originalExtension);
        const newFileType = newFileName.split('.').pop()?.toLowerCase() || attachment.file_type;

        // Get storage paths
        const oldStoragePath = getStoragePathFromUrl(attachment.file_path);
        if (!oldStoragePath) {
          results.errors.push(`Could not extract storage path from: ${attachment.file_path}`);
          results.failed++;
          continue;
        }

        // Create new storage path (keep the same directory structure)
        const pathParts = oldStoragePath.split('/');
        pathParts[pathParts.length - 1] = newFileName; // Replace filename
        const newStoragePath = pathParts.join('/');

        // Rename file in storage
        const renameSuccess = await renameFileInStorage(oldStoragePath, newStoragePath);
        if (!renameSuccess) {
          results.errors.push(`Failed to rename file in storage: ${attachment.file_name}`);
          results.failed++;
          continue;
        }

        // Get new public URL
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(newStoragePath);

        // Update database record
        const updateSuccess = await updateDatabaseRecord(
          attachment.id,
          newFileName,
          newFileType,
          urlData.publicUrl
        );

        if (!updateSuccess) {
          results.errors.push(`Failed to update database record for: ${attachment.file_name}`);
          results.failed++;
          continue;
        }

        console.log(`Successfully renamed: ${attachment.file_name} → ${newFileName}`);
        results.success++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing attachment ${attachment.file_name}:`, error);
        results.errors.push(`Error processing ${attachment.file_name}: ${error}`);
        results.failed++;
      }
    }

    console.log(`Renaming complete. Success: ${results.success}, Failed: ${results.failed}`);
    return results;

  } catch (error) {
    console.error('Error in renameAllExistingFiles:', error);
    results.errors.push(`Fatal error: ${error}`);
    return results;
  }
};

// Function to rename files for current user only
export const renameCurrentUserFiles = async (): Promise<{
  success: number;
  failed: number;
  total: number;
  errors: string[];
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      success: 0,
      failed: 0,
      total: 0,
      errors: ['User not authenticated']
    };
  }

  return renameAllExistingFiles(user.id);
};

// Function to preview what files would be renamed (dry run)
export const previewFileRename = async (userId?: string): Promise<{
  files: Array<{
    currentName: string;
    newName: string;
    purchaseId: string;
    fileSize: number;
  }>;
  total: number;
}> => {
  try {
    let query = supabase.from('purchase_attachments').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: attachments, error } = await query;

    if (error || !attachments) {
      throw error || new Error('No attachments found');
    }

    const files = attachments.map((attachment: AttachmentRecord) => {
      const originalExtension = '.' + (attachment.file_name.split('.').pop() || '');
      const newFileName = generateRandomFileName(originalExtension);
      
      return {
        currentName: attachment.file_name,
        newName: newFileName,
        purchaseId: attachment.purchase_id,
        fileSize: attachment.file_size
      };
    });

    return {
      files,
      total: files.length
    };

  } catch (error) {
    console.error('Error in previewFileRename:', error);
    return {
      files: [],
      total: 0
    };
  }
};
