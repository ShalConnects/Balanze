-- Update subscription plan names to match new two-tier system
-- Change 'pro' and 'enterprise' to 'premium'

UPDATE profiles 
SET subscription = jsonb_set(
  subscription, 
  '{plan}', 
  '"premium"'
)
WHERE subscription->>'plan' IN ('pro', 'enterprise');

-- Verify the update
SELECT 
  id,
  subscription->>'plan' as plan,
  subscription->>'status' as status
FROM profiles 
WHERE subscription->>'plan' IS NOT NULL; 