import { supabase } from './supabase';

export interface FavoriteQuote {
  id: string;
  quote: string;
  author: string;
  category?: 'financial' | 'motivation' | 'success' | 'wisdom';
  created_at: string;
  updated_at: string;
}

export interface CreateFavoriteQuoteData {
  quote: string;
  author: string;
  category?: 'financial' | 'motivation' | 'success' | 'wisdom';
}

export class FavoriteQuotesService {
  private static instance: FavoriteQuotesService;
  private cache: Map<string, FavoriteQuote[]> = new Map();

  static getInstance(): FavoriteQuotesService {
    if (!FavoriteQuotesService.instance) {
      FavoriteQuotesService.instance = new FavoriteQuotesService();
    }
    return FavoriteQuotesService.instance;
  }

  async getFavoriteQuotes(userId: string): Promise<FavoriteQuote[]> {
    // Check cache first
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    try {
      const { data, error } = await supabase
        .from('favorite_quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite quotes:', error);
        return [];
      }

      const quotes = data || [];
      this.cache.set(userId, quotes);
      return quotes;
    } catch (error) {
      console.error('Error fetching favorite quotes:', error);
      return [];
    }
  }

  async addFavoriteQuote(userId: string, quoteData: CreateFavoriteQuoteData): Promise<FavoriteQuote | null> {
    try {
      const { data, error } = await supabase
        .from('favorite_quotes')
        .insert({
          user_id: userId,
          quote: quoteData.quote,
          author: quoteData.author,
          category: quoteData.category
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Duplicate quote - this is fine, just return the existing one
          return await this.getFavoriteQuoteByContent(userId, quoteData.quote, quoteData.author);
        }
        console.error('Error adding favorite quote:', error);
        return null;
      }

      // Update cache
      this.clearCache(userId);
      return data;
    } catch (error) {
      console.error('Error adding favorite quote:', error);
      return null;
    }
  }

  async removeFavoriteQuote(userId: string, quoteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorite_quotes')
        .delete()
        .eq('id', quoteId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing favorite quote:', error);
        return false;
      }

      // Update cache
      this.clearCache(userId);
      return true;
    } catch (error) {
      console.error('Error removing favorite quote:', error);
      return false;
    }
  }

  async removeFavoriteQuoteByContent(userId: string, quote: string, author: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorite_quotes')
        .delete()
        .eq('user_id', userId)
        .eq('quote', quote)
        .eq('author', author);

      if (error) {
        console.error('Error removing favorite quote by content:', error);
        return false;
      }

      // Update cache
      this.clearCache(userId);
      return true;
    } catch (error) {
      console.error('Error removing favorite quote by content:', error);
      return false;
    }
  }

  async isQuoteFavorited(userId: string, quote: string, author: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('favorite_quotes')
        .select('id')
        .eq('user_id', userId)
        .eq('quote', quote)
        .eq('author', author)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking if quote is favorited:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if quote is favorited:', error);
      return false;
    }
  }

  private async getFavoriteQuoteByContent(userId: string, quote: string, author: string): Promise<FavoriteQuote | null> {
    try {
      const { data, error } = await supabase
        .from('favorite_quotes')
        .select('*')
        .eq('user_id', userId)
        .eq('quote', quote)
        .eq('author', author)
        .single();

      if (error) {
        console.error('Error fetching favorite quote by content:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching favorite quote by content:', error);
      return null;
    }
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}

export const favoriteQuotesService = FavoriteQuotesService.getInstance();

// Convenience functions
export const getFavoriteQuotes = (userId: string): Promise<FavoriteQuote[]> => 
  favoriteQuotesService.getFavoriteQuotes(userId);

export const addFavoriteQuote = (userId: string, quoteData: CreateFavoriteQuoteData): Promise<FavoriteQuote | null> => 
  favoriteQuotesService.addFavoriteQuote(userId, quoteData);

export const removeFavoriteQuote = (userId: string, quoteId: string): Promise<boolean> => 
  favoriteQuotesService.removeFavoriteQuote(userId, quoteId);

export const removeFavoriteQuoteByContent = (userId: string, quote: string, author: string): Promise<boolean> => 
  favoriteQuotesService.removeFavoriteQuoteByContent(userId, quote, author);

export const isQuoteFavorited = (userId: string, quote: string, author: string): Promise<boolean> => 
  favoriteQuotesService.isQuoteFavorited(userId, quote, author); 