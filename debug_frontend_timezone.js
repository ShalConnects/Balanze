// Debug frontend timezone conversion

// Test the exact timestamp from your audit log
const auditLogTime = "2025-10-27 08:58:58.441115+00";
console.log("=== DEBUGGING TIMEZONE CONVERSION ===");
console.log("Raw audit log time:", auditLogTime);

// Test different ways of parsing the date
const date1 = new Date(auditLogTime);
console.log("\n1. new Date(auditLogTime):");
console.log("  - toString():", date1.toString());
console.log("  - toISOString():", date1.toISOString());
console.log("  - getHours():", date1.getHours());
console.log("  - getUTCHours():", date1.getUTCHours());

// Test with explicit UTC parsing
const date2 = new Date(auditLogTime.replace('+00', 'Z'));
console.log("\n2. new Date(auditLogTime.replace('+00', 'Z')):");
console.log("  - toString():", date2.toString());
console.log("  - toISOString():", date2.toISOString());
console.log("  - getHours():", date2.getHours());
console.log("  - getUTCHours():", date2.getUTCHours());

// Test current time for comparison
const now = new Date();
console.log("\n3. Current time (for comparison):");
console.log("  - toString():", now.toString());
console.log("  - toISOString():", now.toISOString());
console.log("  - getHours():", now.getHours());
console.log("  - getUTCHours():", now.getUTCHours());

// Test what your local timezone offset should be
const offset = now.getTimezoneOffset();
console.log("\n4. Timezone info:");
console.log("  - getTimezoneOffset():", offset, "minutes");
console.log("  - Expected offset for UTC+6:", -360, "minutes");
console.log("  - Is UTC+6?", offset === -360);

// Test the format function
const { format } = require('date-fns');
console.log("\n5. date-fns format results:");
console.log("  - format(date1, 'h:mm a'):", format(date1, 'h:mm a'));
console.log("  - format(date2, 'h:mm a'):", format(date2, 'h:mm a'));
console.log("  - format(now, 'h:mm a'):", format(now, 'h:mm a'));
