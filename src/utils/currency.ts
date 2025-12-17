export const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
        case 'BDT':
            return '৳';
        case 'USD':
            return '$';
        case 'GBP':
            return '£';
        case 'EUR':
            return '€';
        case 'CAD':
            return 'C$';
        case 'JPY':
            return '¥';
        case 'AUD':
            return 'A$';
        default:
            return currency;
    }
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (!currency || currency.trim() === '') {
        currency = 'USD';
    }
    
    const symbol = getCurrencySymbol(currency);
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    if (currency === 'BDT') {
        const formatted = absAmount.toLocaleString('en-BD', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
        return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
    }
    
    try {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol'
        }).format(absAmount).replace(currency, symbol);
        return isNegative ? `-${formatted}` : formatted;
    } catch (error) {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(absAmount).replace('USD', symbol);
        return isNegative ? `-${formatted}` : formatted;
    }
};

/**
 * Format currency in compact, human-readable format for large numbers
 * Examples: ৳1.8M, ৳100.5K, ৳500.00
 * Abbreviates numbers >= 10K as K, >= 1M as M
 */
export const formatCurrencyCompact = (amount: number, currency: string = 'USD'): string => {
    if (!currency || currency.trim() === '') {
        currency = 'USD';
    }
    
    const symbol = getCurrencySymbol(currency);
    const absAmount = Math.abs(amount);
    
    // For numbers >= 1 million, show as M
    if (absAmount >= 1000000) {
        const millions = absAmount / 1000000;
        // Show 1 decimal place, but remove trailing zero
        const formatted = millions.toFixed(1).replace(/\.0$/, '');
        return `${symbol}${formatted}M`;
    }
    
    // For numbers >= 10K, show as K
    if (absAmount >= 10000) {
        const thousands = absAmount / 1000;
        // Show 1 decimal place, but remove trailing zero
        const formatted = thousands.toFixed(1).replace(/\.0$/, '');
        return `${symbol}${formatted}K`;
    }
    
    // For smaller numbers, use regular formatting
    if (currency === 'BDT') {
        return `${symbol}${absAmount.toLocaleString('en-BD', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol'
        }).format(absAmount).replace(currency, symbol);
    } catch (error) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(absAmount).replace('USD', symbol);
    }
}; 

