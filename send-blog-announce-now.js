import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env.local');
if (existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const secret = process.env.CRON_SECRET || process.env.LAST_WISH_TRIGGER_SECRET;
const baseUrl = process.env.SITE_URL || process.env.VITE_APP_URL || 'https://balanze.cash';
const url = `${baseUrl.replace(/\/$/, '')}/api/send-blog-announcement-email`;

if (!secret) {
  console.error('Missing CRON_SECRET or LAST_WISH_TRIGGER_SECRET in .env.local');
  process.exit(1);
}

console.log('Sending blog announcement to all users...');
const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}` },
});
const data = await res.json().catch(() => ({}));
if (res.ok) console.log('Done:', JSON.stringify(data, null, 2));
else console.error('Failed:', res.status, data);
process.exit(res.ok ? 0 : 1);
