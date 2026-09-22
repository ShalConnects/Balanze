import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { showToast } from '../lib/toast';
import { FREE_MAIL_CONTACT_LIMIT } from '../types/mailCampaign';
import type {
  MailCampaign,
  MailCampaignMember,
  MailCampaignStatus,
  MailContact,
  MailContactInput,
  MailMemberStatus,
} from '../types/mailCampaign';
import { isValidEmail, normalizeEmail } from '../utils/mailCsv';

const CHUNK = 400;

function normalizePlan(plan: unknown): 'free' | 'premium' | null {
  if (plan == null || plan === '') return null;
  const p = String(plan).toLowerCase().trim();
  if (p === 'free') return 'free';
  // Treat any non-free plan as unlimited (premium / pro / paid / etc.)
  if (p) return 'premium';
  return null;
}

function planFromSubscription(sub: unknown): 'free' | 'premium' | null {
  if (!sub) return null;
  if (typeof sub === 'string') {
    try {
      return planFromSubscription(JSON.parse(sub));
    } catch {
      return normalizePlan(sub);
    }
  }
  if (typeof sub === 'object' && sub !== null && 'plan' in sub) {
    return normalizePlan((sub as { plan?: unknown }).plan);
  }
  return null;
}

/** Sync hint from auth store (may be stale). */
function mailContactLimitSync(): number {
  const plan = planFromSubscription(useAuthStore.getState().profile?.subscription);
  return plan === 'premium' ? -1 : FREE_MAIL_CONTACT_LIMIT;
}

/** Prefer live profile.subscription from DB so Premium is never capped at 1000. */
async function resolveMailContactLimit(): Promise<number> {
  const { profile, user } = useAuthStore.getState();
  const local = planFromSubscription(profile?.subscription);
  if (local === 'premium') return -1;

  if (user?.id) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription')
        .eq('id', user.id)
        .maybeSingle();
      const remote = planFromSubscription(data?.subscription);
      if (remote === 'premium') {
        // Keep UI/store in sync for later checks
        if (profile && remote !== local) {
          useAuthStore.setState({
            profile: {
              ...profile,
              subscription: {
                ...(typeof profile.subscription === 'object' && profile.subscription
                  ? profile.subscription
                  : { status: 'active' as const, validUntil: null }),
                plan: 'premium',
              },
            },
          });
        }
        return -1;
      }
    } catch {
      /* fall through */
    }
  }

  return FREE_MAIL_CONTACT_LIMIT;
}

function remainingSlots(current: number, limit: number): number {
  return limit === -1 ? Infinity : Math.max(0, limit - current);
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: string }).message);
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

async function insertChunks<T extends Record<string, unknown>>(
  table: string,
  rows: T[]
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { data, error } = await supabase.from(table).insert(slice).select();
    if (error) throw error;
    out.push(...((data || []) as T[]));
  }
  return out;
}

interface MailCampaignStore {
  contacts: MailContact[];
  campaigns: MailCampaign[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addContact: (
    input: MailContactInput,
    opts?: { campaignId?: string }
  ) => Promise<MailContact | null>;
  importContacts: (
    rows: MailContactInput[],
    opts?: { campaignId?: string }
  ) => Promise<{ imported: number; skipped: number; limited: boolean; marked: number }>;
  addFromClients: (
    clients: { id: string; email?: string | null; name: string }[]
  ) => Promise<{ imported: number; linked: number }>;
  deleteContacts: (ids: string[]) => Promise<void>;
  createCampaign: (name: string, notes?: string) => Promise<MailCampaign | null>;
  updateCampaign: (
    id: string,
    patch: Partial<Pick<MailCampaign, 'name' | 'notes' | 'status'>>
  ) => Promise<boolean>;
  deleteCampaign: (id: string) => Promise<void>;
  markMembers: (campaignId: string, contactIds: string[]) => Promise<number>;
  unmarkMembers: (campaignId: string, contactIds: string[]) => Promise<number>;
  setMemberStatus: (
    campaignId: string,
    contactIds: string[],
    status: MailMemberStatus
  ) => Promise<number>;
  fetchMembers: (campaignId: string) => Promise<MailCampaignMember[]>;
  memberContactIds: (campaignId: string) => Promise<Set<string>>;
  contactLimit: () => number;
  canAddContacts: (count?: number) => boolean;
}

export const useMailCampaignStore = create<MailCampaignStore>((set, get) => ({
  contacts: [],
  campaigns: [],
  loading: false,
  error: null,

  contactLimit: () => mailContactLimitSync(),
  canAddContacts: (count = 1) =>
    remainingSlots(get().contacts.length, mailContactLimitSync()) >= count,

  fetchAll: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const [cRes, campRes, memRes] = await Promise.all([
        supabase
          .from('mail_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mail_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('mail_campaign_members').select('campaign_id'),
      ]);
      if (cRes.error) throw cRes.error;
      if (campRes.error) throw campRes.error;
      if (memRes.error) throw memRes.error;

      const counts = new Map<string, number>();
      (memRes.data || []).forEach((r: { campaign_id: string }) => {
        counts.set(r.campaign_id, (counts.get(r.campaign_id) || 0) + 1);
      });

      set({
        contacts: (cRes.data || []) as MailContact[],
        campaigns: ((campRes.data || []) as MailCampaign[]).map((c) => ({
          ...c,
          member_count: counts.get(c.id) || 0,
        })),
        loading: false,
      });
    } catch (e: unknown) {
      set({ loading: false, error: errMsg(e) });
    }
  },

  addContact: async (input, opts) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    const email = normalizeEmail(input.email);
    if (!isValidEmail(email)) {
      showToast.error('Invalid email');
      return null;
    }

    const campaignId = opts?.campaignId || '';
    const existing = get().contacts.find((c) => normalizeEmail(c.email) === email);
    if (existing) {
      if (campaignId) {
        await get().markMembers(campaignId, [existing.id]);
        return existing;
      }
      showToast.error('Email already in list');
      return null;
    }

    const limit = await resolveMailContactLimit();
    if (remainingSlots(get().contacts.length, limit) < 1) {
      showToast.error(
        `Email list limit reached (${FREE_MAIL_CONTACT_LIMIT}). Upgrade to Premium for unlimited.`
      );
      return null;
    }
    const { data, error } = await supabase
      .from('mail_contacts')
      .insert({
        user_id: user.id,
        email,
        name: input.name?.trim() || null,
        client_id: input.client_id || null,
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        // Race: another row appeared — reload path via local find after refetch
        await get().fetchAll();
        const again = get().contacts.find((c) => normalizeEmail(c.email) === email);
        if (again && campaignId) {
          await get().markMembers(campaignId, [again.id]);
          return again;
        }
        showToast.error('Email already in list');
        return null;
      }
      showToast.error(error.message);
      return null;
    }
    const row = data as MailContact;
    set({ contacts: [row, ...get().contacts] });
    if (campaignId) await get().markMembers(campaignId, [row.id]);
    return row;
  },

  importContacts: async (rows, opts) => {
    const { user } = useAuthStore.getState();
    if (!user) return { imported: 0, skipped: 0, limited: false, marked: 0 };
    const campaignId = opts?.campaignId || '';
    const limit = await resolveMailContactLimit();
    const unlimited = limit === -1;
    let slotsLeft = remainingSlots(get().contacts.length, limit);
    const byEmail = new Map(
      get().contacts.map((c) => [normalizeEmail(c.email), c] as const)
    );
    const pending: {
      user_id: string;
      email: string;
      name: string | null;
      client_id: string | null;
    }[] = [];
    const markIds = new Set<string>();
    let skipped = 0;
    let limited = false;
    let imported = 0;

    const flush = async () => {
      if (!pending.length) return;
      const slice = pending.splice(0, pending.length);
      const inserted = (await insertChunks('mail_contacts', slice)) as unknown as MailContact[];
      imported += inserted.length;
      set({ contacts: [...inserted, ...get().contacts] });
      if (campaignId) {
        for (const row of inserted) markIds.add(row.id);
      }
    };

    try {
      for (const row of rows) {
        const email = normalizeEmail(row.email);
        if (!isValidEmail(email)) {
          skipped++;
          continue;
        }
        const existing = byEmail.get(email);
        if (existing) {
          skipped++;
          if (campaignId && existing.id) markIds.add(existing.id);
          continue;
        }
        if (!unlimited && slotsLeft <= 0) {
          skipped++;
          limited = true;
          continue;
        }
        byEmail.set(email, {
          id: '',
          user_id: user.id,
          email,
          name: row.name?.trim() || null,
          client_id: row.client_id || null,
          created_at: '',
        });
        pending.push({
          user_id: user.id,
          email,
          name: row.name?.trim() || null,
          client_id: row.client_id || null,
        });
        if (!unlimited) slotsLeft -= 1;
        if (pending.length >= CHUNK) await flush();
      }
      await flush();
    } catch (e) {
      showToast.error(errMsg(e));
      return {
        imported,
        skipped: skipped + pending.length,
        limited,
        marked: 0,
      };
    }

    let marked = 0;
    if (campaignId && markIds.size) {
      marked = await get().markMembers(campaignId, [...markIds]);
    }

    return { imported, skipped, limited, marked };
  },

  addFromClients: async (clients) => {
    const { user } = useAuthStore.getState();
    if (!user) return { imported: 0, linked: 0 };

    const byEmail = new Map(get().contacts.map((c) => [c.email, c]));
    const toInsert: MailContactInput[] = [];
    const toLink: { id: string; client_id: string }[] = [];

    for (const c of clients) {
      const email = normalizeEmail(c.email || '');
      if (!isValidEmail(email)) continue;
      const existing = byEmail.get(email);
      if (existing) {
        if (!existing.client_id) toLink.push({ id: existing.id, client_id: c.id });
        continue;
      }
      toInsert.push({ email, name: c.name, client_id: c.id });
      byEmail.set(email, {
        id: '',
        user_id: user.id,
        email,
        name: c.name,
        client_id: c.id,
        created_at: '',
      });
    }

    let linked = 0;
    for (let i = 0; i < toLink.length; i += CHUNK) {
      const slice = toLink.slice(i, i + CHUNK);
      await Promise.all(
        slice.map(async ({ id, client_id }) => {
          const { error } = await supabase
            .from('mail_contacts')
            .update({ client_id })
            .eq('id', id)
            .eq('user_id', user.id);
          if (!error) {
            linked++;
            set({
              contacts: get().contacts.map((c) =>
                c.id === id ? { ...c, client_id } : c
              ),
            });
          }
        })
      );
    }

    const { imported } = await get().importContacts(toInsert);
    return { imported, linked };
  },

  deleteContacts: async (ids) => {
    if (!ids.length) return;
    const { error } = await supabase.from('mail_contacts').delete().in('id', ids);
    if (error) {
      showToast.error(error.message);
      return;
    }
    const idSet = new Set(ids);
    set({ contacts: get().contacts.filter((c) => !idSet.has(c.id)) });
    await get().fetchAll();
  },

  createCampaign: async (name, notes) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    const trimmed = name.trim();
    if (!trimmed) {
      showToast.error('Campaign name required');
      return null;
    }
    const { data, error } = await supabase
      .from('mail_campaigns')
      .insert({ user_id: user.id, name: trimmed, notes: notes?.trim() || null })
      .select()
      .single();
    if (error) {
      showToast.error(error.message);
      return null;
    }
    const camp = { ...(data as MailCampaign), member_count: 0 };
    set({ campaigns: [camp, ...get().campaigns] });
    return camp;
  },

  updateCampaign: async (id, patch) => {
    const next: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) {
        showToast.error('Campaign name required');
        return false;
      }
      next.name = name;
    }
    if (patch.notes !== undefined) next.notes = patch.notes?.trim() || null;
    if (patch.status !== undefined) next.status = patch.status as MailCampaignStatus;

    const { error } = await supabase.from('mail_campaigns').update(next).eq('id', id);
    if (error) {
      showToast.error(error.message);
      return false;
    }
    set({
      campaigns: get().campaigns.map((c) =>
        c.id === id ? { ...c, ...patch, name: (next.name as string) ?? c.name } : c
      ),
    });
    return true;
  },

  deleteCampaign: async (id) => {
    const { error } = await supabase.from('mail_campaigns').delete().eq('id', id);
    if (error) {
      showToast.error(error.message);
      return;
    }
    set({ campaigns: get().campaigns.filter((c) => c.id !== id) });
  },

  memberContactIds: async (campaignId) => {
    const { data, error } = await supabase
      .from('mail_campaign_members')
      .select('contact_id')
      .eq('campaign_id', campaignId);
    if (error) return new Set<string>();
    return new Set((data || []).map((r: { contact_id: string }) => r.contact_id));
  },

  setMemberStatus: async (campaignId, contactIds, status) => {
    if (!contactIds.length) return 0;
    try {
      for (let i = 0; i < contactIds.length; i += CHUNK) {
        const slice = contactIds.slice(i, i + CHUNK).map((contact_id) => ({
          campaign_id: campaignId,
          contact_id,
          status,
        }));
        const { error } = await supabase
          .from('mail_campaign_members')
          .upsert(slice, { onConflict: 'campaign_id,contact_id' });
        if (error) throw error;
      }
      await get().fetchAll();
      return contactIds.length;
    } catch (e) {
      showToast.error(errMsg(e));
      return 0;
    }
  },

  markMembers: async (campaignId, contactIds) =>
    get().setMemberStatus(campaignId, contactIds, 'marked'),

  unmarkMembers: async (campaignId, contactIds) => {
    if (!contactIds.length) return 0;
    const { data, error } = await supabase
      .from('mail_campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .in('contact_id', contactIds)
      .select();
    if (error) {
      showToast.error(error.message);
      return 0;
    }
    await get().fetchAll();
    return data?.length ?? 0;
  },

  fetchMembers: async (campaignId) => {
    const { data, error } = await supabase
      .from('mail_campaign_members')
      .select('campaign_id, contact_id, status, marked_at, sent_at, mail_contacts(email, name)')
      .eq('campaign_id', campaignId)
      .order('marked_at', { ascending: true });
    if (error) {
      showToast.error(error.message);
      return [];
    }
    return (data || []).map((r: Record<string, unknown>) => {
      const raw = r.mail_contacts;
      const contact = (Array.isArray(raw) ? raw[0] : raw) as {
        email?: string;
        name?: string | null;
      } | null;
      return {
        campaign_id: r.campaign_id as string,
        contact_id: r.contact_id as string,
        status: r.status as MailCampaignMember['status'],
        marked_at: r.marked_at as string,
        sent_at: (r.sent_at as string | null) ?? null,
        email: contact?.email,
        name: contact?.name ?? null,
      };
    });
  },
}));
