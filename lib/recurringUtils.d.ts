export function toYyyyMmDd(date: Date): string;
export function parseLocalDate(dateString: string): Date;
export function todayYyyyMmDd(): string;
export function calculateNextOccurrence(currentDate: string, frequency: string): string;
export function calculateNextOccurrenceAfter(currentDate: string, frequency: string, afterDate: string): string;
export function dueOccurrenceDates(
  startDate: string,
  frequency: string,
  throughDate: string,
  endDate?: string | null,
  max?: number
): { dates: string[]; nextAfter: string };
export function buildRecurringInstance(
  parent: Record<string, any>,
  occurrenceDate: string,
  transactionId: string,
  timestamps?: { created_at?: string; updated_at?: string }
): Record<string, any>;
export function cloneParentDonation(
  supabase: any,
  parent: Record<string, any>,
  child: { id: string; transaction_id: string }
): Promise<{ ok: boolean; error?: any }>;
export function getUpcomingOccurrences(startDate: string, frequency: string, endDate?: string | null, count?: number): string[];
