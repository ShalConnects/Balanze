import { SHOPPING_CATEGORY_SEEDS } from '../constants/expenseNote';
import { normalizeExpenseItemName } from './expenseNoteParser';

const KEYWORDS: Record<string, string[]> = {
  groceries: [
    'toast', 'nutty', 'lentil', 'soya', 'soy', 'egg', 'potato', 'onion', 'rice', 'milk', 'bread', 'flour',
    'sugar', 'salt', 'oil', 'butter', 'cheese', 'yogurt', 'citi', 'pati', 'garlic', 'banana', 'guava', 'orange',
  ],
  vegetables: [
    'gourd', 'bean', 'ladies finger', 'okra', 'spinach', 'tomato', 'cabbage', 'carrot', 'cucumber', 'pepper',
    'yardlong', 'pointed', 'lal moric', 'vegetable', 'turmeric', 'shak',
  ],
  meat_protein: ['chicken', 'fish', 'beef', 'mutton', 'prawn', 'shrimp', 'meat', 'protein', 'tilapia', 'catla', 'koi', 'loitta'],
  household: ['tissue', 'soap', 'detergent', 'shampoo', 'cleaner', 'sponge', 'napkin', 'filter', 'bowl', 'glass', 'jug', 'candle'],
};

export function detectCategorySlug(itemName: string): string {
  const norm = normalizeExpenseItemName(itemName);
  let best = 'uncategorized';
  let bestScore = 0;
  for (const { slug } of SHOPPING_CATEGORY_SEEDS) {
    if (slug === 'uncategorized') continue;
    const words = KEYWORDS[slug] || [];
    let score = 0;
    for (const w of words) {
      if (norm === w || norm.includes(w)) score += w.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = slug;
    }
  }
  return bestScore > 0 ? best : 'uncategorized';
}
