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
/** Supabase/PostgREST default max rows per request. */
const FETCH_PAGE = 1000;

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

async function fetchAllUserContacts(userId: string): Promise<MailContact[]> {
  const out: MailContact[] = [];
  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await supabase
      .from('mail_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + FETCH_PAGE - 1);
    if (error) throw error;
    const rows = (data || []) as MailContact[];
    out.push(...rows);
    if (rows.length < FETCH_PAGE) break;
  }
  return out;
}

/** Lightweight email → id map for import dedupe (paginated). */
async function fetchContactEmailIdMap(userId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await supabase
      .from('mail_contacts')
      .select('id, email')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + FETCH_PAGE - 1);
    if (error) throw error;
    const rows = data || [];
    for (const r of rows as { id: string; email: string }[]) {
      map.set(normalizeEmail(r.email), r.id);
    }
    if (rows.length < FETCH_PAGE) break;
  }
  return map;
}

async function fetchContactsByEmails(
  userId: string,
  emails: string[]
): Promise<MailContact[]> {
  if (!emails.length) return [];
  const out: MailContact[] = [];
  for (let i = 0; i < emails.length; i += CHUNK) {
    const slice = emails.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('mail_contacts')
      .select('*')
      .eq('user_id', userId)
      .in('email', slice);
    if (error) throw error;
    out.push(...((data || []) as MailContact[]));
  }
  return out;
}

/**
 * Insert a chunk; on unique conflict, resolve existing rows and insert only missing.
 * Returns newly inserted rows (existing are not included).
 */
async function insertMailContactsResolvingDuplicates(
  userId: string,
  rows: {
    user_id: string;
    email: string;
    name: string | null;
    client_id: string | null;
  }[]
): Promise<{ inserted: MailContact[]; alreadyHad: MailContact[] }> {
  if (!rows.length) return { inserted: [], alreadyHad: [] };
  const { data, error } = await supabase.from('mail_contacts').insert(rows).select();
  if (!error) return { inserted: (data || []) as MailContact[], alreadyHad: [] };

  // Unique violation — batch collided with DB rows not in local map
  if (error.code !== '23505') throw error;

  const emails = rows.map((r) => r.email);
  const alreadyHad = await fetchContactsByEmails(userId, emails);
  const have = new Set(alreadyHad.map((c) => normalizeEmail(c.email)));
  const missing = rows.filter((r) => !have.has(normalizeEmail(r.email)));
  if (!missing.length) return { inserted: [], alreadyHad };

  const { data: data2, error: error2 } = await supabase
    .from('mail_contacts')
    .insert(missing)
    .select();
  if (error2) {
    if (error2.code === '23505') {
      // Still racing — treat remaining as existing
      const again = await fetchContactsByEmails(
        userId,
        missing.map((r) => r.email)
      );
      return { inserted: [], alreadyHad: [...alreadyHad, ...again] };
    }
    throw error2;
  }
  return { inserted: (data2 || []) as MailContact[], alreadyHad };
}

async function fetchMemberCountsByCampaign(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await supabase
      .from('mail_campaign_members')
      .select('campaign_id')
      .range(from, from + FETCH_PAGE - 1);
    if (error) throw error;
    const rows = data || [];
    for (const r of rows as { campaign_id: string }[]) {
      counts.set(r.campaign_id, (counts.get(r.campaign_id) || 0) + 1);
    }
    if (rows.length < FETCH_PAGE) break;
  }
  return counts;
}

async function countUserContacts(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('mail_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function countClientSourcedContacts(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('mail_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('client_id', 'is', null);
  if (error) throw error;
  return count ?? 0;
}

async function fetchMemberContactIds(campaignId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await supabase
      .from('mail_campaign_members')
      .select('contact_id')
      .eq('campaign_id', campaignId)
      .range(from, from + FETCH_PAGE - 1);
    if (error) throw error;
    const rows = data || [];
    for (const r of rows as { contact_id: string }[]) ids.add(r.contact_id);
    if (rows.length < FETCH_PAGE) break;
  }
  return ids;
}

async function refreshCampaignMemberCounts(
  set: (partial: Partial<{ campaigns: MailCampaign[] }>) => void,
  get: () => { campaigns: MailCampaign[] }
) {
  try {
    const counts = await fetchMemberCountsByCampaign();
    set({
      campaigns: get().campaigns.map((c) => ({
        ...c,
        member_count: counts.get(c.id) || 0,
      })),
    });
  } catch {
    /* non-fatal */
  }
}

export type MailImportProgress = {
  phase: 'preparing' | 'importing' | 'marking' | 'done';
  processed: number;
  total: number;
  imported: number;
  skipped: number;
};

export type MailDeleteProgress = {
  deleted: number;
  total: number;
};

interface MailCampaignStore {
  contacts: MailContact[];
  /** Exact DB total — use for cards/badge (not page size). */
  contactCount: number;
  /** Exact DB count of contacts linked to a client. */
  clientSourcedCount: number;
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
    opts?: {
      campaignId?: string;
      onProgress?: (p: MailImportProgress) => void;
    }
  ) => Promise<{ imported: number; skipped: number; limited: boolean; marked: number }>;
  addFromClients: (
    clients: { id: string; email?: string | null; name: string }[]
  ) => Promise<{ imported: number; linked: number }>;
  deleteContacts: (
    ids: string[],
    opts?: { onProgress?: (p: MailDeleteProgress) => void }
  ) => Promise<boolean>;
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
  contactCount: 0,
  clientSourcedCount: 0,
  campaigns: [],
  loading: false,
  error: null,

  contactLimit: () => mailContactLimitSync(),
  canAddContacts: (count = 1) =>
    remainingSlots(get().contactCount || get().contacts.length, mailContactLimitSync()) >=
    count,

  fetchAll: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const [contacts, campRes, counts, contactCount, clientSourcedCount] = await Promise.all([
        fetchAllUserContacts(user.id),
        supabase
          .from('mail_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        fetchMemberCountsByCampaign(),
        countUserContacts(user.id),
        countClientSourcedContacts(user.id),
      ]);
      if (campRes.error) throw campRes.error;

      set({
        contacts,
        contactCount,
        clientSourcedCount,
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
    if (remainingSlots(get().contactCount || get().contacts.length, limit) < 1) {
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
    set({
      contacts: [row, ...get().contacts],
      contactCount: get().contactCount + 1,
      clientSourcedCount: row.client_id
        ? get().clientSourcedCount + 1
        : get().clientSourcedCount,
    });
    if (campaignId) await get().markMembers(campaignId, [row.id]);
    return row;
  },

  importContacts: async (rows, opts) => {
    const { user } = useAuthStore.getState();
    if (!user) return { imported: 0, skipped: 0, limited: false, marked: 0 };
    const campaignId = opts?.campaignId || '';
    const onProgress = opts?.onProgress;
    const total = rows.length;
    onProgress?.({ phase: 'preparing', processed: 0, total, imported: 0, skipped: 0 });

    const limit = await resolveMailContactLimit();
    const unlimited = limit === -1;

    // Paginated DB map — never trust the in-memory list (capped at ~1000 by API default)
    let emailIdMap: Map<string, string>;
    try {
      emailIdMap = await fetchContactEmailIdMap(user.id);
    } catch (e) {
      showToast.error(errMsg(e));
      return { imported: 0, skipped: 0, limited: false, marked: 0 };
    }

    let slotsLeft = remainingSlots(emailIdMap.size, limit);
    const pending: {
      user_id: string;
      email: string;
      name: string | null;
      client_id: string | null;
    }[] = [];
    const insertedAll: MailContact[] = [];
    const markIds = new Set<string>();
    let skipped = 0;
    let limited = false;
    let imported = 0;
    let processed = 0;

    const report = (phase: MailImportProgress['phase'] = 'importing') => {
      onProgress?.({ phase, processed, total, imported, skipped });
    };

    const flush = async () => {
      if (!pending.length) return;
      const slice = pending.splice(0, pending.length);
      const { inserted, alreadyHad } = await insertMailContactsResolvingDuplicates(
        user.id,
        slice
      );
      imported += inserted.length;
      skipped += alreadyHad.length;
      insertedAll.push(...inserted);
      for (const row of inserted) {
        emailIdMap.set(normalizeEmail(row.email), row.id);
        if (campaignId) markIds.add(row.id);
      }
      for (const row of alreadyHad) {
        emailIdMap.set(normalizeEmail(row.email), row.id);
        if (campaignId) markIds.add(row.id);
      }
      report('importing');
      await new Promise((r) => setTimeout(r, 0));
    };

    try {
      for (const row of rows) {
        processed++;
        const email = normalizeEmail(row.email);
        if (!isValidEmail(email)) {
          skipped++;
          if (processed % 2000 === 0) report();
          continue;
        }
        if (emailIdMap.has(email)) {
          const existingId = emailIdMap.get(email);
          skipped++;
          if (campaignId && existingId) markIds.add(existingId);
          if (processed % 2000 === 0) report();
          continue;
        }
        if (!unlimited && slotsLeft <= 0) {
          skipped++;
          limited = true;
          if (processed % 2000 === 0) report();
          continue;
        }
        // Reserve so the same CSV email isn't queued twice before flush
        emailIdMap.set(email, '');
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
      if (insertedAll.length) {
        set({ contacts: [...insertedAll, ...get().contacts] });
      }
      report('done');
      return {
        imported,
        skipped: skipped + pending.length,
        limited,
        marked: 0,
      };
    }

    if (insertedAll.length) {
      const idSet = new Set(insertedAll.map((c) => c.id));
      const merged = [
        ...insertedAll,
        ...get().contacts.filter((c) => !idSet.has(c.id)),
      ];
      set({
        contacts: merged,
        contactCount: emailIdMap.size,
      });
    } else {
      set({ contactCount: emailIdMap.size });
    }

    // Keep client-sourced exact count in sync for cards
    try {
      const clientSourcedCount = await countClientSourcedContacts(user.id);
      set({ clientSourcedCount });
    } catch {
      /* non-fatal */
    }

    let marked = 0;
    if (campaignId && markIds.size) {
      report('marking');
      // Drop placeholder empty ids
      const ids = [...markIds].filter(Boolean);
      marked = await get().markMembers(campaignId, ids);
    }

    onProgress?.({
      phase: 'done',
      processed: total,
      total,
      imported,
      skipped,
    });
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

  deleteContacts: async (ids, opts) => {
    if (!ids.length) return false;
    const { user } = useAuthStore.getState();
    if (!user) return false;
    const onProgress = opts?.onProgress;
    try {
      let deleted = 0;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        const { error } = await supabase
          .from('mail_contacts')
          .delete()
          .eq('user_id', user.id)
          .in('id', slice);
        if (error) throw error;
        deleted += slice.length;
        onProgress?.({ deleted, total: ids.length });
        await new Promise((r) => setTimeout(r, 0));
      }
      const idSet = new Set(ids);
      const removedClientSourced = get().contacts.filter(
        (c) => idSet.has(c.id) && c.client_id
      ).length;
      set({
        contacts: get().contacts.filter((c) => !idSet.has(c.id)),
        contactCount: Math.max(0, get().contactCount - ids.length),
        clientSourcedCount: Math.max(0, get().clientSourcedCount - removedClientSourced),
      });
      // Cascade removes campaign members in DB — refresh counts without reloading all emails
      await refreshCampaignMemberCounts(set, get);
      return true;
    } catch (e) {
      showToast.error(errMsg(e));
      await get().fetchAll();
      return false;
    }
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
    try {
      return await fetchMemberContactIds(campaignId);
    } catch {
      return new Set<string>();
    }
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
      await refreshCampaignMemberCounts(set, get);
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
    try {
      let removed = 0;
      for (let i = 0; i < contactIds.length; i += CHUNK) {
        const slice = contactIds.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from('mail_campaign_members')
          .delete()
          .eq('campaign_id', campaignId)
          .in('contact_id', slice)
          .select('contact_id');
        if (error) throw error;
        removed += data?.length ?? 0;
      }
      await refreshCampaignMemberCounts(set, get);
      return removed;
    } catch (e) {
      showToast.error(errMsg(e));
      return 0;
    }
  },

  fetchMembers: async (campaignId) => {
    const out: MailCampaignMember[] = [];
    try {
      for (let from = 0; ; from += FETCH_PAGE) {
        const { data, error } = await supabase
          .from('mail_campaign_members')
          .select('campaign_id, contact_id, status, marked_at, sent_at, mail_contacts(email, name)')
          .eq('campaign_id', campaignId)
          .order('marked_at', { ascending: true })
          .range(from, from + FETCH_PAGE - 1);
        if (error) throw error;
        const rows = data || [];
        for (const r of rows as Record<string, unknown>[]) {
          const raw = r.mail_contacts;
          const contact = (Array.isArray(raw) ? raw[0] : raw) as {
            email?: string;
            name?: string | null;
          } | null;
          out.push({
            campaign_id: r.campaign_id as string,
            contact_id: r.contact_id as string,
            status: r.status as MailCampaignMember['status'],
            marked_at: r.marked_at as string,
            sent_at: (r.sent_at as string | null) ?? null,
            email: contact?.email,
            name: contact?.name ?? null,
          });
        }
        if (rows.length < FETCH_PAGE) break;
      }
      return out;
    } catch (e) {
      showToast.error(errMsg(e));
      return out;
    }
  },
}));
