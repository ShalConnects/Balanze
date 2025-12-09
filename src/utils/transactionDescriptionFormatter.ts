/**
 * Utility function to standardize transaction description display
 * Maps various backend description formats to consistent frontend display
 */

export function formatTransactionDescription(description: string, personName?: string): string {
  if (!description) return description;

  // Extract person name from description if not provided
  const extractedPersonName = personName || extractPersonNameFromDescription(description);

  // Map all existing formats to consistent display format
  if (description.includes('Lent to') || description.includes('lent to')) {
    return `Lent to ${extractedPersonName}`;
  }
  
  if (description.includes('Borrowed from') || description.includes('borrowed from')) {
    return `Borrowed from ${extractedPersonName}`;
  }
  
  if (description.includes('Repayment from') || 
      description.includes('repayment from') ||
      description.includes('Loan repayment from') ||
      description.includes('loan repayment from')) {
    return `Repayment from ${extractedPersonName}`;
  }
  
  if (description.includes('Repayment to') ||
      description.includes('repayment to') ||
      description.includes('Debt repayment to') || 
      description.includes('debt repayment to')) {
    return `Repayment to ${extractedPersonName}`;
  }
  
  if (description.includes('Received partial return from') || 
      description.includes('Partial return from') || 
      description.includes('Partial loan repayment from')) {
    return `Partial return from ${extractedPersonName}`;
  }
  
  if (description.includes('Made partial payment to') || 
      description.includes('Partial return to')) {
    return `Partial return to ${extractedPersonName}`;
  }

  // Fallback to original description
  return description;
}

/**
 * Extract person name from description
 * Handles various formats like "Lent to John", "Borrowed from Jane", etc.
 */
function extractPersonNameFromDescription(description: string): string {
  // Common patterns to extract person name
  const patterns = [
    /Lent to (.+)/i,
    /Borrowed from (.+)/i,
    /Repayment from (.+)/i,
    /Loan repayment from (.+)/i,
    /Repayment to (.+)/i,
    /Debt repayment to (.+)/i,
    /Received partial return from (.+)/i,
    /Partial return from (.+)/i,
    /Made partial payment to (.+)/i,
    /Partial return to (.+)/i,
    /Partial loan repayment from (.+)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted name (remove any extra info in parentheses)
      return match[1].split(' (')[0].trim();
    }
  }

  // If no pattern matches, return the original description
  return description;
}
