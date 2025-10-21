-- Update Achievements for Free Plan Limits
-- This script updates achievement requirements to work with free plan limits

-- Update Account Master to require 3 accounts instead of 5
UPDATE achievements 
SET requirements = '{"action": "create_account", "count": 3}'::jsonb
WHERE name = 'Account Master';

-- Update Multi-Account to require 2 accounts instead of 3
UPDATE achievements 
SET requirements = '{"action": "create_account", "count": 2}'::jsonb
WHERE name = 'Multi-Account';

-- Update Portfolio Manager to require 3 investments instead of 5
UPDATE achievements 
SET requirements = '{"action": "create_investment", "count": 3}'::jsonb
WHERE name = 'Portfolio Manager';

-- Update Premium Power User to require 3 premium features instead of 5
UPDATE achievements 
SET requirements = '{"action": "use_premium_feature", "count": 3}'::jsonb
WHERE name = 'Premium Power User';

-- Show updated achievements
SELECT name, requirements FROM achievements 
WHERE name IN ('Account Master', 'Multi-Account', 'Portfolio Manager', 'Premium Power User')
ORDER BY name;
