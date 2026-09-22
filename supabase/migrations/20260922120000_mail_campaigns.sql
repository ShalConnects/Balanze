-- Mail campaigns: email list (contacts) + campaign marking. No sending yet;
-- status columns are reserved for future SMTP delivery.

CREATE TABLE IF NOT EXISTS public.mail_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  client_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mail_contacts_email_nonempty CHECK (char_length(trim(email)) > 0),
  CONSTRAINT mail_contacts_user_email_unique UNIQUE (user_id, email)
);

CREATE INDEX IF NOT EXISTS mail_contacts_user_id_idx ON public.mail_contacts (user_id);
CREATE INDEX IF NOT EXISTS mail_contacts_client_id_idx ON public.mail_contacts (client_id)
  WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.mail_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'sending', 'sent', 'archived')),
  subject TEXT,
  body_html TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mail_campaigns_user_id_idx ON public.mail_campaigns (user_id);

CREATE TABLE IF NOT EXISTS public.mail_campaign_members (
  campaign_id UUID NOT NULL REFERENCES public.mail_campaigns (id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.mail_contacts (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'marked'
    CHECK (status IN ('marked', 'queued', 'sent', 'skipped', 'bounced', 'failed', 'unsubscribed')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  PRIMARY KEY (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS mail_campaign_members_contact_id_idx
  ON public.mail_campaign_members (contact_id);

ALTER TABLE public.mail_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_campaign_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mail_contacts_own" ON public.mail_contacts;
CREATE POLICY "mail_contacts_own" ON public.mail_contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mail_campaigns_own" ON public.mail_campaigns;
CREATE POLICY "mail_campaigns_own" ON public.mail_campaigns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mail_campaign_members_own" ON public.mail_campaign_members;
CREATE POLICY "mail_campaign_members_own" ON public.mail_campaign_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mail_campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mail_campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );
