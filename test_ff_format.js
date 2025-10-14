// Test script to verify FF format transaction IDs
const { generateTransactionId, formatTransactionId, isValidTransactionId } = require('./src/utils/transactionId.ts');

console.log('Testing FF format transaction IDs...\n');

// Test generation
console.log('Generated transaction IDs:');
for (let i = 0; i < 5; i++) {
  const id = generateTransactionId();
  console.log(`  ${id}`);
}

console.log('\nTesting validation:');
const testIds = ['FF1234', 'FF0000', 'FF9999', 'FF123', 'FF12345', 'GG1234', 'FF12A4'];
testIds.forEach(id => {
  console.log(`  ${id}: ${isValidTransactionId(id) ? 'VALID' : 'INVALID'}`);
});

console.log('\nTesting formatting:');
const sampleId = 'FF5678';
console.log(`  Original: ${sampleId}`);
console.log(`  Formatted: ${formatTransactionId(sampleId)}`);

console.log('\nFF format transaction IDs are ready!');
console.log('Format: FF + 4 random digits (e.g., FF1234)');
console.log('Total length: 6 characters'); 