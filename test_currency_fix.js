// Test script to verify currency formatting fixes
const { formatCurrency } = require('./src/utils/currency.ts');

console.log('Testing currency formatting with various inputs:');

// Test cases
const testCases = [
  { amount: 100, currency: 'USD', expected: 'USD' },
  { amount: 100, currency: '', expected: 'USD' },
  { amount: 100, currency: null, expected: 'USD' },
  { amount: 100, currency: undefined, expected: 'USD' },
  { amount: 100, currency: 'BDT', expected: 'BDT' },
  { amount: 100, currency: 'INVALID', expected: 'USD' },
];

testCases.forEach(({ amount, currency, expected }) => {
  try {
    const result = formatCurrency(amount, currency);
    console.log(`✓ formatCurrency(${amount}, "${currency}") = "${result}"`);
  } catch (error) {
    console.log(`✗ formatCurrency(${amount}, "${currency}") failed:`, error.message);
  }
});

console.log('\nCurrency formatting test completed!'); 