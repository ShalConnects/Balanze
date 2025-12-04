import { supabase } from './supabase';
import { createNotification } from './notifications';

/**
 * Send notification to all users about a new feature
 */
export async function sendFeatureNotificationToAllUsers(
  title: string,
  body: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<{ success: boolean; usersNotified: number; errors: string[] }> {
  const errors: string[] = [];
  let usersNotified = 0;

  try {
    // Get all users from the database
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return { success: true, usersNotified: 0, errors: ['No users found'] };
    }

    // Send notification to each user
    const notificationPromises = users.map(async (user) => {
      try {
        await createNotification(
          user.id,
          title,
          type,
          body,
          true, // Show toast
          'new_feature' // Notification category
        );
        usersNotified++;
      } catch (error) {
        const errorMessage = `Failed to notify user ${user.id}: ${error}`;
        errors.push(errorMessage);
      }
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    return { success: true, usersNotified, errors };
  } catch (error) {
    const errorMessage = `Failed to send feature notification: ${error}`;
    errors.push(errorMessage);
    return { success: false, usersNotified, errors };
  }
}

/**
 * Send notification about the new drag-and-drop reordering feature
 */
export async function notifyUsersAboutReorderingFeature(): Promise<{ success: boolean; usersNotified: number; errors: string[] }> {
  const title = '🎉 New Feature: Drag & Drop Account Reordering!';
  const body = `You can now reorder your accounts by dragging them! 

✨ How to use:
1. Click the "Re-arrange" button next to "Add Account"
2. Drag accounts by the grip handle (≡) to reorder them
3. Click "Done" when finished

💡 This feature is available on desktop for the best experience. Your account order will be saved and remembered!`;

  return await sendFeatureNotificationToAllUsers(title, body, 'info');
}

/**
 * Send notification about any new feature
 */
export async function notifyUsersAboutNewFeature(
  featureName: string,
  description: string,
  instructions?: string
): Promise<{ success: boolean; usersNotified: number; errors: string[] }> {
  const title = `🎉 New Feature: ${featureName}!`;
  let body = description;
  
  if (instructions) {
    body += `\n\n✨ How to use:\n${instructions}`;
  }

  return await sendFeatureNotificationToAllUsers(title, body, 'info');
}
