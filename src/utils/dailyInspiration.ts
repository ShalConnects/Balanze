export interface DailyInspirationQuote {
  q: string;
  a: string;
}

export type DailyInspirationCategory = 'financial' | 'motivation' | 'success' | 'wisdom';

export const DAILY_INSPIRATION_FALLBACK_QUOTES: DailyInspirationQuote[] = [
  { q: "Financial freedom is not about having a lot of money, it's about having a lot of options.", a: 'Robert Kiyosaki' },
  { q: 'The best investment you can make is in yourself.', a: 'Warren Buffett' },
  { q: "Don't save what is left after spending, but spend what is left after saving.", a: 'Warren Buffett' },
  { q: 'A budget is telling your money where to go instead of wondering where it went.', a: 'John C. Maxwell' },
  { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
  { q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
  { q: "Don't watch the clock; do what it does. Keep going.", a: 'Sam Levenson' },
  { q: 'The journey of a thousand miles begins with one step.', a: 'Lao Tzu' },
  { q: 'The best time to plant a tree was 20 years ago. The second best time is now.', a: 'Chinese Proverb' },
  { q: 'Change your thoughts and you change your world.', a: 'Norman Vincent Peale' },
];

export function getRandomDailyInspirationQuote(): DailyInspirationQuote {
  const i = Math.floor(Math.random() * DAILY_INSPIRATION_FALLBACK_QUOTES.length);
  return DAILY_INSPIRATION_FALLBACK_QUOTES[i];
}

const DAILY_INSPIRATION_API_URL = 'https://dummyjson.com/quotes/random';

export async function getDailyInspirationQuote(signal?: AbortSignal): Promise<DailyInspirationQuote> {
  try {
    const response = await fetch(DAILY_INSPIRATION_API_URL, { signal });
    if (!response.ok) throw new Error('Failed to fetch quote');
    const data: { quote?: string; author?: string } = await response.json();
    if (!data.quote?.trim()) throw new Error('Invalid quote payload');
    return {
      q: data.quote.trim(),
      a: data.author?.trim() || 'Unknown'
    };
  } catch {
    return getRandomDailyInspirationQuote();
  }
}

export function inferDailyInspirationCategory(quote: string): DailyInspirationCategory {
  const text = quote.toLowerCase();
  if (
    text.includes('money') ||
    text.includes('financial') ||
    text.includes('wealth') ||
    text.includes('investment') ||
    text.includes('saving') ||
    text.includes('debt') ||
    text.includes('income') ||
    text.includes('expense') ||
    text.includes('budget') ||
    text.includes('profit')
  ) {
    return 'financial';
  }
  if (
    text.includes('motivation') ||
    text.includes('inspire') ||
    text.includes('dream') ||
    text.includes('goal') ||
    text.includes('passion') ||
    text.includes('drive')
  ) {
    return 'motivation';
  }
  if (
    text.includes('success') ||
    text.includes('achieve') ||
    text.includes('win') ||
    text.includes('victory') ||
    text.includes('triumph') ||
    text.includes('accomplish')
  ) {
    return 'success';
  }
  return 'wisdom';
}

