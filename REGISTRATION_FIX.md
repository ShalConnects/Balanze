# User Registration Fix

## Problem
You're getting a "Database error saving new user" when trying to register a new user. This is caused by a database trigger that's failing when trying to create a profile for the new user.

## Root Cause
The database has a trigger `on_auth_user_created` that automatically creates a profile when a new user is registered. This trigger is failing, which causes the entire user registration to fail.

## Solution

### Step 1: Disable the Problematic Trigger
Run this SQL script in your Supabase SQL editor:

```sql
-- Disable the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### Step 2: Verify the Fix
Run this test script to verify registration works:

```bash
node test_registration_fix.js
```

### Step 3: Alternative - Fix the Trigger (Optional)
If you want to keep the automatic profile creation, run this SQL script instead:

```sql
-- Create a safer trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists to avoid conflicts
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RAISE LOG 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Try to insert profile with error handling
    BEGIN
        INSERT INTO public.profiles (
            id, 
            full_name, 
            local_currency,
            role,
            subscription,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            'USD',
            'user',
            '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Profile created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
            -- Return NEW to allow user creation to continue
            RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Current Implementation
The application now handles profile creation manually in the `signUp` function in `src/stores/authStore.ts`. This ensures that:

1. User registration succeeds even if profile creation fails
2. Profile creation is handled gracefully with proper error logging
3. The user can still log in even if profile creation fails

## Testing
After applying the fix:

1. Try registering a new user through the UI
2. Check the browser console for any error messages
3. Verify that the user can log in after email confirmation

## Files Modified
- `src/stores/authStore.ts` - Updated signUp function to handle profile creation manually
- `disable_trigger_temporarily.sql` - SQL script to disable the problematic trigger
- `fix_registration_trigger.sql` - SQL script to create a safer trigger (alternative)

## Next Steps
1. Run the SQL script to disable the trigger
2. Test user registration
3. If everything works, you can optionally implement the safer trigger version
4. Monitor for any remaining issues 