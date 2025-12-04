// HumorEngine: Generates context-aware funny messages for analytics alerts
// This is standalone and does not modify existing functionality.

import { UserContext } from './humorContext';

export type AlertType = 'surplus' | 'deficit' | 'savings_rate' | 'category_spending' | 'general';

export type HumorMessage = {
  message: string;
  emoji: string;
  personality: 'cheerleader' | 'sarcastic' | 'coach' | 'wise';
};

export class HumorEngine {
  private context: UserContext;
  private intensity: 'mild' | 'medium' | 'high' = 'medium';
  private personality: 'cheerleader' | 'sarcastic' | 'coach' | 'wise' | 'auto' = 'auto';

  constructor(
    context: UserContext, 
    intensity: 'mild' | 'medium' | 'high' = 'medium',
    personality: 'cheerleader' | 'sarcastic' | 'coach' | 'wise' | 'auto' = 'auto'
  ) {
    this.context = context;
    this.intensity = intensity;
    this.personality = personality;
  }

  // Format currency with proper symbols
  private formatCurrency(amount: number, currency: string): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'BDT': '৳',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RUB': '₽',
      'BRL': 'R$',
      'MXN': '$',
      'KRW': '₩',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$',
      'ZAR': 'R',
      'TRY': '₺',
      'THB': '฿',
      'PHP': '₱',
      'IDR': 'Rp',
      'MYR': 'RM',
      'VND': '₫'
    };

    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  }

  // Capitalize the first character of a string
  private capitalizeFirst(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Load settings from localStorage
  static fromContext(context: UserContext): HumorEngine {
    const savedSettings = localStorage.getItem('humorSettings');
    let intensity: 'mild' | 'medium' | 'high' = 'medium';
    let personality: 'cheerleader' | 'sarcastic' | 'coach' | 'wise' | 'auto' = 'auto';
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        intensity = parsed.intensity || 'medium';
        personality = parsed.personality || 'auto';
      } catch (error) {
        console.warn('Failed to parse humor settings:', error);
      }
    }
    
    return new HumorEngine(context, intensity, personality);
  }

  generateSurplusMessage(amount: number, currency: string): HumorMessage {
    const { savingsRate, tags } = this.context;
    const effectivePersonality = this.personality === 'auto' ? this.context.primaryPersonalitySuggestion : this.personality;
    const formattedAmount = this.formatCurrency(amount, currency);
    
    // Intensity-based message variations
    if (this.intensity === 'mild') {
      if (tags.includes('savings_champion')) {
        return {
          message: `👍 Great job! You have a ${formattedAmount} surplus this month!`,
          emoji: '👍',
          personality: effectivePersonality
        };
      }
      return {
        message: `💪 Nice work! You saved ${formattedAmount} this month!`,
        emoji: '💪',
        personality: effectivePersonality
      };
    }
    
    if (this.intensity === 'high') {
      if (tags.includes('savings_champion')) {
        return {
          message: `🐉 DRAGON MODE ACTIVATED! ${formattedAmount} surplus - are you secretly hoarding gold like Smaug?!`,
          emoji: '🐉',
          personality: 'cheerleader'
        };
      }
      if (tags.includes('struggling_but_trying')) {
        return {
          message: `🎉 PLOT TWIST! You're not broke anymore! ${formattedAmount} says you're adulting like a CHAMPION!`,
          emoji: '🎉',
          personality: 'cheerleader'
        };
      }
      return {
        message: `💰 MONEY WIZARD ALERT! ${formattedAmount} just sitting there like you own the place!`,
        emoji: '💰',
        personality: 'cheerleader'
      };
    }
    
    // Medium intensity (default)
    if (tags.includes('savings_champion')) {
      return {
        message: `🐉 Dragon mode activated! ${formattedAmount} surplus - are you hoarding gold?`,
        emoji: '🐉',
        personality: 'cheerleader'
      };
    }
    
    if (tags.includes('struggling_but_trying')) {
      return {
        message: `🎉 Plot twist: You're not broke anymore! ${formattedAmount} says you're adulting correctly!`,
        emoji: '🎉',
        personality: 'coach'
      };
    }
    
    if (savingsRate > 50) {
      return {
        message: `💰 Look at you, money wizard! ${formattedAmount} just sitting there like a boss!`,
        emoji: '💰',
        personality: 'cheerleader'
      };
    }
    
    return {
      message: `👍 Great job! You have a ${formattedAmount} surplus this month!`,
      emoji: '👍',
      personality: effectivePersonality
    };
  }

  generateDeficitMessage(amount: number, currency: string): HumorMessage {
    const { tags } = this.context;
    const formattedAmount = this.formatCurrency(amount, currency);
    
    if (tags.includes('impulse_buyer')) {
      return {
        message: `📞 Your wallet just called, it wants a break! ${formattedAmount} deficit this month.`,
        emoji: '📞',
        personality: 'sarcastic'
      };
    }
    
    if (tags.includes('category_dominant')) {
      return {
        message: `💸 Your money is having more fun than you are! ${formattedAmount} deficit this month.`,
        emoji: '💸',
        personality: 'sarcastic'
      };
    }
    
    if (tags.includes('struggling_but_trying')) {
      return {
        message: `💪 Every comeback starts with a setback! ${formattedAmount} deficit - you've got this!`,
        emoji: '💪',
        personality: 'coach'
      };
    }
    
    return {
      message: `⚠️ You have a ${formattedAmount} deficit this month. Time to tighten the belt!`,
      emoji: '⚠️',
      personality: 'coach'
    };
  }

  generateSavingsRateMessage(rate: number): HumorMessage {
    const { tags } = this.context;
    
    // Handle negative savings rates (spending more than earning)
    if (rate < 0) {
      const absRate = Math.abs(rate);
      const fractionalDescription = this.getFractionalDescription(absRate, true);
      const capitalized = this.capitalizeFirst(fractionalDescription);
      
      if (tags.includes('struggling_but_trying')) {
        return {
          message: `💪 Every financial journey has bumps! ${capitalized} - you're learning!`,
          emoji: '💪',
          personality: 'coach'
        };
      }
      return {
        message: `📈 Consider increasing your savings rate. Currently ${fractionalDescription}.`,
        emoji: '📈',
        personality: 'coach'
      };
    }
    
    const fractionalDescription = this.getFractionalDescription(rate, false);
    const capitalized = this.capitalizeFirst(fractionalDescription);
    
    if (rate >= 50) {
      return {
        message: `🤯 ${capitalized}? Are you secretly a squirrel preparing for winter? Impressive!`,
        emoji: '🤯',
        personality: 'cheerleader'
      };
    }
    
    if (rate >= 30) {
      return {
        message: `💰 ${capitalized}? You're either a monk or you've discovered the secret to not buying things!`,
        emoji: '💰',
        personality: 'sarcastic'
      };
    }
    
    if (rate >= 20) {
      return {
        message: `🎯 ${capitalized}! Your future self is going to high-five you so hard!`,
        emoji: '🎯',
        personality: 'cheerleader'
      };
    }
    
    if (rate >= 10) {
      return {
        message: `💪 Good progress! You're saving ${fractionalDescription}.`,
        emoji: '💪',
        personality: 'coach'
      };
    }
    
    return {
      message: `📈 Consider increasing your savings rate. Currently ${fractionalDescription}.`,
      emoji: '📈',
      personality: 'coach'
    };
  }

  // Convert percentage to fractional description
  private getFractionalDescription(rate: number, isNegative: boolean = false): string {
    const absRate = Math.abs(rate);
    
    // Handle very small percentages
    if (absRate < 1) {
      return isNegative ? "spending just a tiny bit more than earning" : "saving less than 1% of your income";
    }
    
    // Handle common fractional ranges
    if (absRate >= 90) return "saving more than 9/10 of your income";
    if (absRate >= 80) return "saving more than 4/5 of your income";
    if (absRate >= 75) return "saving more than 3/4 of your income";
    if (absRate >= 66) return "saving more than 2/3 of your income";
    if (absRate >= 60) return "saving more than 3/5 of your income";
    if (absRate >= 50) return "saving more than half of your income";
    if (absRate >= 40) return "saving more than 2/5 of your income";
    if (absRate >= 33) return "saving more than 1/3 of your income";
    if (absRate >= 25) return "saving more than 1/4 of your income";
    if (absRate >= 20) return "saving more than 1/5 of your income";
    if (absRate >= 10) return "saving more than 1/10 of your income";
    
    // For very small positive rates
    if (absRate >= 5) return "saving less than 1/20 of your income";
    if (absRate >= 1) return "saving less than 1/100 of your income";
    
    // Fallback to rounded percentage for edge cases
    const rounded = Math.round(absRate);
    return isNegative ? `spending about ${rounded}% more than earning` : `saving about ${rounded}% of your income`;
  }

  generateCategorySpendingMessage(category: string, amount: number, currency: string): HumorMessage {
    const { tags, details } = this.context;
    const formattedAmount = this.formatCurrency(amount, currency);
    
    if (category.toLowerCase().includes('donation') || category.toLowerCase().includes('charity')) {
      return {
        message: `❤️ Your heart is bigger than your wallet! ${formattedAmount} in donations - you're basically a superhero!`,
        emoji: '❤️',
        personality: 'cheerleader'
      };
    }
    
    if (category.toLowerCase().includes('food') || category.toLowerCase().includes('restaurant')) {
      return {
        message: `🍕 ${formattedAmount} on ${category}? Your taste buds are living their best life!`,
        emoji: '🍕',
        personality: 'sarcastic'
      };
    }
    
    if (category.toLowerCase().includes('household') || category.toLowerCase().includes('home')) {
      return {
        message: `🏠 ${formattedAmount} on ${category}? Your home is your castle, and castles cost money!`,
        emoji: '🏠',
        personality: 'sarcastic'
      };
    }
    
    if (category.toLowerCase().includes('entertainment') || category.toLowerCase().includes('fun')) {
      return {
        message: `🎉 ${formattedAmount} on ${category}? You're investing in happiness - that's priceless!`,
        emoji: '🎉',
        personality: 'cheerleader'
      };
    }
    
    if (tags.includes('category_dominant')) {
      return {
        message: `🎯 ${category} at ${formattedAmount} - you've found your financial passion!`,
        emoji: '🎯',
        personality: 'sarcastic'
      };
    }
    
    return {
      message: `📊 Your highest spending category is ${category} at ${formattedAmount}`,
      emoji: '📊',
      personality: 'wise'
    };
  }

  generateGeneralMessage(): HumorMessage {
    const { tags, totalTransactions } = this.context;
    
    if (totalTransactions === 0) {
      return {
        message: `📈 No transactions found. Add some transactions to see insights!`,
        emoji: '📈',
        personality: 'coach'
      };
    }
    
    if (tags.includes('minimalist')) {
      return {
        message: `🧘‍♀️ You've achieved financial nirvana! Minimal transactions, maximum zen!`,
        emoji: '🧘‍♀️',
        personality: 'wise'
      };
    }
    
    return {
      message: `📈 Keep tracking your finances to unlock more insights!`,
      emoji: '📈',
      personality: 'coach'
    };
  }

  // Main method to generate context-aware messages
  generateMessage(type: AlertType, data: any): HumorMessage {
    switch (type) {
      case 'surplus':
        return this.generateSurplusMessage(data.amount, data.currency);
      case 'deficit':
        return this.generateDeficitMessage(data.amount, data.currency);
      case 'savings_rate':
        return this.generateSavingsRateMessage(data.rate);
      case 'category_spending':
        return this.generateCategorySpendingMessage(data.category, data.amount, data.currency);
      case 'general':
        return this.generateGeneralMessage();
      default:
        return this.generateGeneralMessage();
    }
  }
}
