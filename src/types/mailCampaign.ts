/** Free plan cap for mail_contacts rows. Premium = unlimited (-1). */
export const FREE_MAIL_CONTACT_LIMIT = 1000;

export type MailCampaignStatus = 'draft' | 'ready' | 'sending' | 'sent' | 'archived';
export type MailMemberStatus =
  | 'marked'
  | 'unsubscribed'
  | 'queued'
  | 'sent'
  | 'skipped'
  | 'bounced'
  | 'failed';

export interface MailContact {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  client_id: string | null;
  created_at: string;
}

export interface MailCampaign {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  status: MailCampaignStatus;
  subject: string | null;
  body_html: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined count from store fetch */
  member_count?: number;
}

export interface MailCampaignMember {
  campaign_id: string;
  contact_id: string;
  status: MailMemberStatus;
  marked_at: string;
  sent_at: string | null;
  email?: string;
  name?: string | null;
}

export interface MailContactInput {
  email: string;
  name?: string | null;
  client_id?: string | null;
}
