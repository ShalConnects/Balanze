// Test date conversion to see what's happening

const auditLogTime = "2025-10-27 08:58:58.441115+00";
const dateObj = new Date(auditLogTime);

console.log("Raw audit log time:", auditLogTime);
console.log("Date object:", dateObj);
console.log("Date object toString:", dateObj.toString());
console.log("Date object toISOString:", dateObj.toISOString());
console.log("Date object getHours():", dateObj.getHours());
console.log("Date object getUTCHours():", dateObj.getUTCHours());

// Test with date-fns format
const { format } = require('date-fns');
console.log("date-fns format result:", format(dateObj, 'h:mm a'));

// Test current time for comparison
const now = new Date();
console.log("\nCurrent time:");
console.log("Now toString:", now.toString());
console.log("Now getHours():", now.getHours());
console.log("Now getUTCHours():", now.getUTCHours());
console.log("date-fns format now:", format(now, 'h:mm a'));
