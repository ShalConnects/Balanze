# Urgent Notification System

## Overview
The urgent notification system automatically creates notifications for time-sensitive items like overdue lend/borrow records and planned purchases.

## Features

### Duplicate Prevention
- Each urgent notification is created with a unique identifier `[ID:type_id]` in the body
- The system checks for existing unread notifications before creating new ones
- Notifications are only created once per item until marked as read or deleted

### Automatic Cleanup
- Old notifications are automatically cleared when items are no longer urgent
- Lend/borrow notifications are cleared when status changes from 'active'/'overdue'
- Purchase notifications are cleared when status changes from 'planned'

### Notification Types
- **Overdue**: 🚨 URGENT (red/error)
- **Due Soon** (≤3 days): ⚠️ DUE SOON (yellow/warning)  
- **Upcoming** (4-7 days): 📅 UPCOMING (blue/info)

## Usage

### Automatic Checks
The system automatically checks for urgent items every hour:
```typescript
import { urgentNotificationService } from './urgentNotifications';

// Automatic check (called by App.tsx)
await urgentNotificationService.checkAndCreateUrgentNotifications(userId);
```

### Manual Testing
```typescript
// Force check (bypasses time interval)
await urgentNotificationService.forceCheckUrgentNotifications(userId);

// Clear all urgent notifications
await urgentNotificationService.clearAllUrgentNotifications(userId);
```

## Database Structure

### Notifications Table
- `user_id`: UUID (references auth.users)
- `title`: Text (notification title with urgency prefix)
- `body`: Text (message with unique ID: `[ID:type_id]`)
- `type`: 'info' | 'warning' | 'error'
- `read`: Boolean (default: false)
- `deleted`: Boolean (default: false)
- `created_at`: Timestamp

### Unique Identifiers
- Lend/Borrow: `[ID:lend_borrow_uuid]`
- Purchase: `[ID:purchase_uuid]`

## User Actions
Users can:
1. **Mark as Read**: Notification disappears from unread list
2. **Delete**: Notification is permanently removed
3. **Clear All**: All notifications are marked as deleted

## Configuration
- Check interval: 1 hour (configurable in `checkInterval`)
- Urgent window: 7 days (items due within 7 days or overdue)
- Due soon window: 3 days (items due within 3 days) 