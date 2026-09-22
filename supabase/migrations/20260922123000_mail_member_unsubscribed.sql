-- Allow per-campaign unsubscribe tracking (and keep other send-ready statuses).
ALTER TABLE public.mail_campaign_members
  DROP CONSTRAINT IF EXISTS mail_campaign_members_status_check;

ALTER TABLE public.mail_campaign_members
  ADD CONSTRAINT mail_campaign_members_status_check
  CHECK (status IN ('marked', 'queued', 'sent', 'skipped', 'bounced', 'failed', 'unsubscribed'));
