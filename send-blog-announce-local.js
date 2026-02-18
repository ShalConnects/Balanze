/**
 * Send blog announcement from your machine. No secret needed.
 * Uses .env.local: SUPABASE_URL, SUPABASE_SERVICE_KEY, SMTP_USER, SMTP_PASS (same as last-wish).
 * Run: node send-blog-announce-local.js
 */
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
if (existsSync(join(__dirname, '.env.local'))) dotenv.config({ path: join(__dirname, '.env.local') });
else dotenv.config();

const { runBlogAnnouncement } = await import('./api/send-blog-announcement-email.js');
console.log('Sending blog announcement to all users...');
const result = await runBlogAnnouncement();
console.log('Done:', JSON.stringify(result, null, 2));
