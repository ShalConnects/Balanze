# Desktop Performance Optimizations

## ✅ Completed Optimizations

### 1. **Forced Reflows Fixed** (Est. savings: ~40ms)
- ✅ **PomodoroTimerBar**: Cached button dimensions at drag start, batched layout reads with `requestAnimationFrame`
- ✅ **CustomDropdown**: Batched all `getBoundingClientRect()` calls with `requestAnimationFrame`
- **Impact**: Eliminated forced reflows during drag operations and dropdown positioning
- **Files Modified**:
  - `src/components/Layout/PomodoroTimerBar.tsx`
  - `src/components/Purchases/CustomDropdown.tsx`

### 2. **CSP Worker Directive Added**
- ✅ Added `worker-src 'self' blob:` to Content Security Policy
- **Impact**: Fixed Sentry Web Worker creation error in browser console
- **File Modified**: `vercel.json`

## 📊 Current Desktop Performance

| Metric | Value | Status |
|--------|-------|--------|
| **First Contentful Paint** | 1.1s | ✅ Good |
| **Largest Contentful Paint** | 1.3s | ✅ Good |
| **Total Blocking Time** | 350ms | ✅ Good |
| **Cumulative Layout Shift** | 0.001 | ✅ Excellent |
| **Speed Index** | 2.0s | ✅ Good |

## ⚠️ Remaining Issues & Solutions

### 1. **Image Optimization** (Est. savings: 242 KiB) - HIGH PRIORITY
**Critical for LCP improvement**

#### `/main-dashboard.png` (260 KiB → ~77 KiB)
- **Current**: 1643x1060px PNG
- **Displayed**: 896x578px on desktop
- **Action Required**:
  1. Create responsive sizes: 400w, 800w, 1200w, 1643w
  2. Convert all to WebP format
  3. Update `LandingPage.tsx` to use `<picture>` with `srcset`

#### `/android_view.png` (84 KiB → ~25 KiB)
- **Action Required**: Convert to WebP format

**Tools**: [Squoosh.app](https://squoosh.app/) or `sharp-cli`

### 2. **CSS Render Blocking** (Est. savings: 60ms)
**Issue**: Vite bundles CSS into a single file (`index-CtDCCAS_.css`, 30.9 KiB)
- **Current**: CSS loads synchronously, blocking render
- **Limitation**: Vite's default behavior bundles all CSS together
- **Optional Solutions**:
  - Use `vite-plugin-critical` to inline critical CSS
  - Manually extract above-the-fold styles
  - Consider CSS-in-JS for critical styles only

**Note**: 60ms is relatively small compared to image savings (242 KiB)

### 3. **Preconnect Hints Not Detected**
**Issue**: Lighthouse reports "no origins were preconnected"
- **Current**: Preconnect hints are correctly configured in `index.html`
- **Possible Reasons**:
  1. Resources aren't used immediately on page load
  2. Lighthouse timing detection issue
  3. Preconnects established but not detected by audit

**Verification**: Check Network tab in DevTools - preconnects should show up as early connections

**Current Preconnects**:
- `https://xgncksougafntusfnf.supabase.co` (Supabase)
- `https://fonts.gstatic.com` (Google Fonts)
- `https://fonts.googleapis.com` (Google Fonts API)
- `https://api.producthunt.com` (ProductHunt)

### 4. **Legacy JavaScript** (Est. savings: 12 KiB)
**Issue**: Some dependencies still include legacy polyfills
- **Sources**: Quill, Paddle, Recharts, Sentry
- **Current**: Already targeting ES2020+ browsers
- **Note**: This is from third-party dependencies, not our code
- **Impact**: Minimal (12 KiB is small)

### 5. **ProductHunt Cache** (Est. savings: 1 KiB)
- External domain cache cannot be controlled
- Consider hosting cached version locally if needed

## 🎯 Priority Actions

1. **HIGH**: Convert images to WebP (242 KiB savings)
2. **MEDIUM**: Consider CSS critical path optimization (60ms savings)
3. **LOW**: Legacy JS from dependencies (12 KiB - minimal impact)

## 📈 Expected Improvements After Image Optimization

| Metric | Current | After Images | Improvement |
|--------|---------|--------------|-------------|
| **LCP** | 1.3s | ~1.0s | -23% |
| **FCP** | 1.1s | ~0.9s | -18% |
| **Image Size** | 344 KiB | ~102 KiB | -70% |
| **Page Weight** | ~1.0 MB | ~0.76 MB | -24% |

## 🔧 Technical Details

### Forced Reflow Fixes

**Before** (PomodoroTimerBar):
```typescript
// Read layout on every mouse move - causes forced reflow
const buttonWidth = buttonElement.offsetWidth;
const buttonHeight = buttonElement.offsetHeight;
setPosition({ x: constrainedX, y: constrainedY });
```

**After**:
```typescript
// Cache dimensions once at drag start
buttonDimensionsRef.current = {
  width: buttonElement.offsetWidth,
  height: buttonElement.offsetHeight,
};

// Batch layout reads/writes with requestAnimationFrame
rafId = requestAnimationFrame(() => {
  // All layout reads batched together
  setPosition({ x: constrainedX, y: constrainedY });
});
```

**Before** (CustomDropdown):
```typescript
// Multiple getBoundingClientRect() calls cause forced reflows
const buttonRect = buttonRef.current.getBoundingClientRect();
const rect = parent.getBoundingClientRect();
```

**After**:
```typescript
// Batch all layout reads together
requestAnimationFrame(() => {
  const buttonRect = buttonRef.current.getBoundingClientRect();
  const rect = parent.getBoundingClientRect();
  // All reads happen in one frame
});
```

## ✅ Summary

Desktop performance is already **excellent**:
- ✅ LCP: 1.3s (target: <2.5s)
- ✅ FCP: 1.1s (target: <1.8s)
- ✅ TBT: 350ms (target: <600ms)
- ✅ CLS: 0.001 (target: <0.1)

**Main remaining optimization**: Image conversion to WebP (242 KiB savings)

