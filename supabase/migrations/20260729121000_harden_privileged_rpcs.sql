-- Harden privileged SECURITY DEFINER RPCs
-- 1) Disable free client-side subscription upgrades
-- 2) Revoke dangerous anon execute grants on deletion helpers

-- ---------------------------------------------------------------------------
-- Subscription upgrades must only run via service-role webhooks / server routes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upgrade_user_subscription(
    user_uuid UUID,
    plan_name TEXT,
    payment_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION
      'upgrade_user_subscription is disabled for direct client calls; use verified payment webhooks';
END;
$$;

REVOKE ALL ON FUNCTION public.upgrade_user_subscription(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upgrade_user_subscription(UUID, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.upgrade_user_subscription(UUID, TEXT, TEXT) FROM authenticated;

-- Disable common 4-arg overload used by Paddle client code, if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'upgrade_user_subscription'
      AND pg_get_function_identity_arguments(p.oid) = 'user_uuid uuid, plan_name text, payment_method text, paddle_transaction_id text'
  ) OR EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'upgrade_user_subscription'
      AND pg_get_function_identity_arguments(p.oid) LIKE '%paddle_transaction_id%'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.upgrade_user_subscription(
        user_uuid UUID,
        plan_name TEXT,
        payment_method TEXT DEFAULT NULL,
        paddle_transaction_id TEXT DEFAULT NULL
      )
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      BEGIN
        RAISE EXCEPTION
          'upgrade_user_subscription is disabled for direct client calls; use verified payment webhooks';
      END;
      $body$;
    $fn$;
    EXECUTE 'REVOKE ALL ON FUNCTION public.upgrade_user_subscription(UUID, TEXT, TEXT, TEXT) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.upgrade_user_subscription(UUID, TEXT, TEXT, TEXT) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.upgrade_user_subscription(UUID, TEXT, TEXT, TEXT) FROM authenticated';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Revoke anon execute on deletion helpers (prevent unauthenticated mass delete)
-- Authenticated callers still require a follow-up auth.uid() guard in app SQL.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'delete_user_completely',
        'delete_user_completely_direct',
        'simple_delete_auth_user',
        'delete_auth_user_on_profile_delete'
      )
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE ALL ON FUNCTION public.%I(%s) FROM anon',
        r.proname,
        r.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not revoke anon on %.%(%) : %', 'public', r.proname, r.args, SQLERRM;
    END;
  END LOOP;
END $$;
