# External Cron Setup for Last Wish (Free Hourly Checks)

Since Vercel Hobby plan only allows daily cron jobs, use a free external cron service to call the Last Wish API hourly.

## Option 1: cron-job.org (Recommended - Free)

1. Go to https://cron-job.org/
2. Sign up for a free account
3. Create a new cron job:
   - **Title**: Balanze Last Wish Check
   - **URL**: `https://balanze-[your-deployment].vercel.app/api/last-wish-public`
   - **Schedule**: Every hour (`0 * * * *`)
   - **Request Method**: GET or POST
   - **Save** the cron job

## Option 2: EasyCron (Free Tier)

1. Go to https://www.easycron.com/
2. Sign up for free account
3. Create cron job:
   - **URL**: Your Vercel API endpoint
   - **Schedule**: Hourly
   - **Method**: GET

## Option 3: GitHub Actions (If repo is public)

Create `.github/workflows/last-wish-cron.yml`:

```yaml
name: Last Wish Hourly Check
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Last Wish Check
        run: |
          curl -X GET https://balanze-[your-deployment].vercel.app/api/last-wish-public
```

## Option 4: UptimeRobot (Free - 50 monitors)

1. Go to https://uptimerobot.com/
2. Create HTTP(s) Monitor
3. Set URL to your API endpoint
4. Set interval to hourly (or use their cron feature)

## Current Setup

- Vercel cron removed from `vercel.json` (stays within Hobby limits)
- API endpoint: `/api/last-wish-public` (ready to be called externally)
- Manual trigger: `/api/manual-trigger-last-wish` (for testing)

## Testing

Test your external cron by calling:
```bash
curl https://balanze-[your-deployment].vercel.app/api/last-wish-public
```

