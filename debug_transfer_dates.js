// Debug Transfer Dates
// This script will help identify what data is being fetched for transfers

// Check what the fetchTransferHistory function is actually returning
console.log('=== DEBUGGING TRANSFER DATES ===');

// Mock data to simulate what might be happening
const mockTransfer = {
  id: 'test-123',
  date: '2024-09-02', // This is just a DATE, no time
  created_at: '2024-09-02T10:30:00.000Z', // This has actual timestamp
  amount: 200,
  type: 'expense',
  note: 'Test transfer'
};

console.log('Mock transfer data:', mockTransfer);
console.log('Date field (DATE only):', mockTransfer.date);
console.log('Created at (TIMESTAMP):', mockTransfer.created_at);

// Test date formatting
const dateOnly = new Date(mockTransfer.date);
const timestamp = new Date(mockTransfer.created_at);

console.log('new Date(date) - defaults to midnight:', dateOnly);
console.log('new Date(created_at) - actual time:', timestamp);

console.log('Formatted date only:', dateOnly.toLocaleString());
console.log('Formatted timestamp:', timestamp.toLocaleString());

// Test timezone conversion
console.log('Date only in UTC:', dateOnly.toUTCString());
console.log('Timestamp in UTC:', timestamp.toUTCString());

console.log('Date only in local timezone:', dateOnly.toString());
console.log('Timestamp in local timezone:', timestamp.toString());

// This explains why you're seeing 6:00 AM
// If your timezone is UTC+6 (like Bangladesh), then:
// UTC midnight (00:00:00) becomes 6:00 AM in your local time
console.log('\n=== TIMEZONE EXPLANATION ===');
console.log('If date field is DATE only (no time), JavaScript defaults to 00:00:00 UTC');
console.log('When converted to local timezone (UTC+6), this becomes 6:00 AM');
console.log('Solution: Use created_at timestamp instead of date for time display'); 