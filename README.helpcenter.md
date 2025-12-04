# Balanze Help Center & Onboarding System

This document provides a runbook for managing the help center, onboarding system, and creating micro-video content for Balanze.

## Overview

The help center system includes:
- **Interactive product tours** using react-joyride
- **Knowledge base** with search functionality
- **Article management** system
- **Analytics tracking** for user interactions

## Architecture

### Components

- `ProductTour.tsx` - Interactive guided tours
- `KBSearch.tsx` - Knowledge base search interface
- `KBArticlePage.tsx` - Individual article display
- `analytics.js` - Lightweight analytics tracking

### Routes

- `/help` - Main help center with KB search and product tours
- `/kb/:slug` - Individual knowledge base articles

## Product Tour Flow

The interactive product tours guide users through key features:

### Account Creation Tour
- **Tour ID:** `add-account`
- **Target:** `[data-tour="add-account"]`
- **Purpose:** Guide users to create their first account

### Transaction Tour
- **Tour ID:** `add-transaction`
- **Target:** `[data-tour="add-transaction"]`
- **Purpose:** Show users how to add transactions

### Analytics Tour
- **Tour ID:** `view-analytics`
- **Target:** `[data-tour="analytics-overview"]`
- **Purpose:** Introduce users to financial insights

## Data-Tour Attributes

Key UI elements with tour attributes:

```html
<!-- Navigation -->
<nav data-tour="navigation">

<!-- Dashboard -->
<div data-tour="dashboard">

<!-- Quick Actions -->
<button data-tour="quick-actions">

<!-- Account Management -->
<button data-tour="add-account">
<div data-tour="account-form">

<!-- Transactions -->
<div data-tour="transaction-form">

<!-- Analytics -->
<div data-tour="analytics-overview">
<div data-tour="spending-chart">
<div data-tour="balance-trend">
<button data-tour="export-data">
```

## Creating Micro-Videos & GIFs

### Recording Setup

1. **Screen Resolution:** 1920x1080 or 1280x720
2. **Recording Software:** OBS Studio (free) or Loom
3. **Duration:** 20-90 seconds per task
4. **Frame Rate:** 30fps for smooth playback

### Recording Guidelines

1. **Clear UI:** Use a clean browser window, no extensions visible
2. **Smooth Movements:** Move cursor slowly and deliberately
3. **Pauses:** Brief pause at key steps for emphasis
4. **Consistent Timing:** 2-3 seconds per major action

### Conversion to GIF

```bash
# Install FFmpeg if not already installed
# Convert MP4 to optimized GIF
ffmpeg -i recording.mp4 -vf "fps=12,scale=600:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i recording.mp4 -i palette.png -vf "fps=12,scale=600:-1:flags=lanczos,paletteuse" output.gif

# Alternative single command (lower quality)
ffmpeg -i recording.mp4 -vf "fps=12,scale=600:-1:flags=lanczos" -loop 0 output.gif
```

### File Organization

```
static/placeholders/onboarding-gifs/
├── step1-add-account.gif
├── step2-add-transaction.gif
├── step3-view-analytics.gif
├── general-navigation.gif
└── quick-actions.gif
```

## Content Guidelines

### Onboarding Copy

**Quickstart Header:** "Get started with Balanze"
**Progress Indicator:** "Complete these 3 steps to unlock your financial insights"
**Step Buttons:** "Guide me" and "Go to [feature]"
**Completion:** "Perfect! I'm ready"

### Tour Copy

**Step 1:** "Start here! Click this button to create your first financial account. You can add bank accounts, credit cards, cash wallets, or any account you want to track."

**Step 2:** "Now let's add your first transaction! Click here to record income or expenses. This is where you'll track all your financial activity."

**Step 3:** "Welcome to your financial command center! Here you can see your spending patterns, income trends, and account balances at a glance."

## Analytics Events

### Tracked Events

```javascript
// Onboarding
track('onboarding_step', { step, action, timestamp })
track('onboarding_skip')
track('onboarding_finish', { completed_steps, total_steps })

// Tours
track('tour_event', { status, action, index, type, step_id })

// Help Center
track('help_center', { action, ...data })
track('kb_search', { query, category })
track('kb_article_view', { slug, title, category })
track('kb_article_feedback', { slug, helpful, title })
```

### Analytics Integration

The system uses a lightweight analytics shim that supports:
- Vercel Analytics (`window.va.track`)
- Google Analytics via dataLayer
- Custom analytics solutions

## Content Management

### Adding New Articles

1. Create article in `MOCK_ARTICLES` object in `KBSearch.tsx`
2. Add full content in `MOCK_ARTICLES` object in `KBArticlePage.tsx`
3. Use the article template in `docs/kb/article-template.md`

### Article Structure

```javascript
{
  slug: 'article-url-slug',
  title: 'Human Readable Title',
  description: 'Brief description for search results',
  category: 'Getting Started|Accounts|Transactions|Analytics|Advanced',
  tags: ['tag1', 'tag2', 'tag3'],
  difficulty: 'beginner|intermediate|advanced',
  lastUpdated: 'YYYY-MM-DD',
  readTime: 'X min read',
  content: 'Full markdown content...',
  relatedArticles: ['slug1', 'slug2']
}
```

## Testing Checklist

### Onboarding Flow
- [ ] Quickstart appears for new users
- [ ] Steps mark as complete based on user actions
- [ ] Tours launch from quickstart buttons
- [ ] Tours follow correct element targeting
- [ ] Analytics events fire correctly

### Knowledge Base
- [ ] Search returns relevant results
- [ ] Articles display correctly
- [ ] Related articles link properly
- [ ] Feedback buttons work
- [ ] Mobile responsive design

### Tours
- [ ] All data-tour attributes present
- [ ] Tours start at correct elements
- [ ] Step progression works smoothly
- [ ] Skip and finish options work
- [ ] Mobile compatibility

## Deployment Notes

### Environment Variables
No additional environment variables required. Analytics integration uses existing Vercel Analytics setup.

### Static Assets
Ensure GIF files are optimized for web:
- Max file size: 2MB per GIF
- Dimensions: 600px width maximum
- Frame rate: 12fps for optimal size/quality

### Performance
- Lazy load tour components
- Compress GIF assets
- Monitor analytics payload size

## Maintenance

### Regular Tasks
1. **Weekly:** Review analytics for completion rates
2. **Monthly:** Update article content and screenshots
3. **Quarterly:** Review and update tour flows based on UI changes

### Monitoring
- Track onboarding completion rates
- Monitor help center search queries
- Review article feedback scores
- Analyze tour abandonment points

## Support Integration

For issues with the help center system:

1. Check browser console for JavaScript errors
2. Verify data-tour attributes are present
3. Test tour functionality in different browsers
4. Review analytics events in development tools

## Future Enhancements

### Planned Features
- Video embedding support (react-player ready)
- Advanced search with filters
- User progress tracking
- Personalized recommendations
- Multi-language support

### Integration Points
- CMS integration for article management
- Advanced analytics platforms
- User feedback collection
- A/B testing for onboarding flows

---

*Last updated: December 2024*
*System Version: 1.0*
