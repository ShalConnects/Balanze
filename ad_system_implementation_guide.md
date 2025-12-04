# Ad System Implementation Guide

## Overview
This guide outlines the implementation of an ad system for FinTrack with monthly transaction limits (50/month for free users) and ad-free experience for premium users.

## Revenue Model Strategy

### Free Plan (50 transactions/month + Ads)
- **Monthly transaction limit**: 50 transactions
- **Ad types**: Banner, Interstitial, Rewarded Video, Native
- **Revenue streams**: Ad impressions, clicks, rewarded video views
- **User experience**: Functional but with ads

### Premium Plan ($7.99/month - No Ads)
- **Transaction limit**: Unlimited
- **Ad experience**: Completely ad-free
- **Additional features**: Analytics, priority support, export data
- **Value proposition**: Unlimited usage + premium features

## Ad Integration Architecture

### 1. Mobile App (Android) - AdMob Integration

#### Setup Requirements
```javascript
// dependencies in package.json
"react-native-google-mobile-ads": "^13.0.0"
```

#### Ad Configuration
```javascript
// AdMob configuration
const adConfig = {
  // Test ads for development
  testDeviceIds: ['TEST_DEVICE_ID'],
  
  // Production ad unit IDs
  adUnitIds: {
    banner: 'ca-app-pub-3940256099942544/6300978111', // Test ID
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test ID
    rewarded: 'ca-app-pub-3940256099942544/5224354917' // Test ID
  }
};
```

#### Ad Components
```javascript
// Banner Ad Component
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AdBanner = ({ userPlan }) => {
  if (userPlan === 'premium' || userPlan === 'premium_lifetime') {
    return null; // No ads for premium users
  }

  return (
    <BannerAd
      unitId={adConfig.adUnitIds.banner}
      size={BannerAdSize.ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
};

// Interstitial Ad Component
const showInterstitialAd = async () => {
  const { isLoaded, load } = useInterstitialAd(adConfig.adUnitIds.interstitial);
  
  if (isLoaded) {
    await load();
    // Show ad between major actions
  }
};

// Rewarded Video Ad Component
const showRewardedAd = async () => {
  const { isLoaded, load } = useRewardedAd(adConfig.adUnitIds.rewarded);
  
  if (isLoaded) {
    await load();
    // Reward user with extra transactions
  }
};
```

### 2. Web Application - Google AdSense Integration

#### HTML Ad Placements
```html
<!-- Banner Ad in Sidebar -->
<div id="sidebar-ad" class="ad-container">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="XXXXXXXXXX"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>

<!-- Native Ad in Transaction List -->
<div id="transaction-list-ad" class="native-ad-container">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="XXXXXXXXXX"
       data-ad-format="fluid"
       data-layout-key="-6t+ed+2i-1n-4k"></ins>
</div>
```

#### JavaScript Integration
```javascript
// Ad loading and management
class AdManager {
  constructor(userPlan) {
    this.userPlan = userPlan;
    this.adsEnabled = userPlan === 'free';
  }

  loadAds() {
    if (!this.adsEnabled) return;
    
    // Load Google AdSense
    (adsbygoogle = window.adsbygoogle || []).push({});
  }

  showInterstitialAd() {
    if (!this.adsEnabled) return;
    
    // Show interstitial between major actions
    // Implement with your chosen ad network
  }

  showRewardedAd() {
    if (!this.adsEnabled) return;
    
    // Show rewarded video for extra transactions
    // Reward: +10 transactions for current month
  }
}
```

## Database Schema Updates

### User Ad Preferences
```sql
-- Add ad preferences to user profiles
ALTER TABLE profiles ADD COLUMN ad_preferences JSONB DEFAULT '{
  "banner_ads": true,
  "interstitial_ads": true,
  "rewarded_video_ads": true,
  "native_ads": true,
  "ad_frequency": "normal"
}'::jsonb;

-- Track ad interactions
CREATE TABLE ad_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_type TEXT NOT NULL, -- 'banner', 'interstitial', 'rewarded', 'native'
    ad_network TEXT NOT NULL, -- 'admob', 'adsense', 'facebook'
    interaction_type TEXT NOT NULL, -- 'impression', 'click', 'reward_earned'
    reward_value INTEGER DEFAULT 0, -- Extra transactions earned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Frontend Implementation

### React Components
```javascript
// AdWrapper Component
const AdWrapper = ({ children, userPlan, adType = 'banner' }) => {
  const { adsEnabled } = useAdConfiguration(userPlan);
  
  if (!adsEnabled) {
    return children;
  }

  return (
    <div className="ad-wrapper">
      {children}
      <AdBanner type={adType} />
    </div>
  );
};

// Usage in components
const TransactionList = ({ userPlan }) => {
  return (
    <AdWrapper userPlan={userPlan} adType="native">
      <TransactionListContent />
    </AdWrapper>
  );
};
```

### Ad-Free Experience for Premium Users
```javascript
// Premium user experience
const Dashboard = ({ userPlan }) => {
  const isPremium = userPlan === 'premium' || userPlan === 'premium_lifetime';
  
  return (
    <div className="dashboard">
      {!isPremium && <AdBanner />}
      <DashboardContent />
      {!isPremium && <AdBanner />}
    </div>
  );
};
```

## Revenue Optimization

### Ad Placement Strategy
1. **Banner Ads**: Bottom of screens, sidebar
2. **Interstitial Ads**: Between major actions (add transaction, view reports)
3. **Rewarded Video**: Earn extra transactions (5-10 per video)
4. **Native Ads**: Within transaction lists, account summaries

### User Experience Balance
- **Frequency**: Max 1 interstitial per session
- **Timing**: Show ads after user actions, not before
- **Rewards**: Meaningful rewards for ad engagement
- **Premium value**: Clear upgrade path to ad-free experience

## Monitoring and Analytics

### Key Metrics to Track
```sql
-- Ad performance metrics
SELECT 
    DATE_TRUNC('day', created_at) as date,
    ad_type,
    COUNT(*) as impressions,
    COUNT(CASE WHEN interaction_type = 'click' THEN 1 END) as clicks,
    ROUND(COUNT(CASE WHEN interaction_type = 'click' THEN 1 END)::FLOAT / COUNT(*) * 100, 2) as ctr
FROM ad_interactions
GROUP BY DATE_TRUNC('day', created_at), ad_type
ORDER BY date DESC;
```

### Revenue Tracking
- **Ad revenue per user**: Track monthly ad revenue per free user
- **Conversion rate**: Free to premium conversion
- **User retention**: Impact of ads on user retention
- **Ad engagement**: Click-through rates, rewarded video completion

## Implementation Timeline

### Phase 1: Database Updates (Week 1)
- [ ] Update subscription plans for monthly limits
- [ ] Add ad configuration functions
- [ ] Create ad interaction tracking

### Phase 2: Mobile App Integration (Week 2)
- [ ] Integrate Google AdMob
- [ ] Implement banner and interstitial ads
- [ ] Add rewarded video ads

### Phase 3: Web App Integration (Week 3)
- [ ] Integrate Google AdSense
- [ ] Implement web ad placements
- [ ] Add native ad integration

### Phase 4: Testing & Optimization (Week 4)
- [ ] A/B test ad placements
- [ ] Monitor user experience metrics
- [ ] Optimize ad frequency and types

## Expected Revenue Impact

### Conservative Estimates
- **Free users**: 1,000 users × $2-5/month ad revenue = $2,000-5,000/month
- **Premium conversions**: 5-10% conversion rate
- **Total revenue increase**: 30-50% from current subscription-only model

### Success Metrics
- **User retention**: Maintain >80% monthly retention
- **Ad engagement**: >2% click-through rate
- **Premium conversion**: >5% free-to-premium conversion
- **Revenue per user**: $3-5/month from free users via ads

## Conclusion

This ad system implementation provides:
1. **Sustainable revenue** from free users
2. **Clear upgrade incentive** to premium plans
3. **Balanced user experience** with meaningful rewards
4. **Scalable architecture** for future growth

The combination of monthly transaction limits (50) + strategic ad placement creates a compelling freemium model that balances user value with business sustainability.
