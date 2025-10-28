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
    
    if (currency === 'BDT') {
        const symbol = getCurrencySymbol(currency);
        return `${symbol}${Math.abs(amount).toLocaleString('en-BD', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }
    
    try {
        const symbol = getCurrencySymbol(currency);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol'
        }).format(Math.abs(amount)).replace(currency, symbol);
    } catch (error) {
        const symbol = getCurrencySymbol('USD');
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(Math.abs(amount)).replace('USD', symbol);
    }
}; 

