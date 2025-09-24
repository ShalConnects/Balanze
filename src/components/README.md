# Personal Finance Dashboard

A comprehensive, accessible, and responsive personal finance dashboard built with React, TypeScript, and Tailwind CSS. This dashboard follows evidence-based design principles and provides AI-powered insights for better financial decision-making.

## Features

### 📊 Core Components

- **FinanceDashboard.tsx** - Main dashboard component with responsive layout
- **PhoneLayout.tsx** - Mobile-optimized layout with swipeable KPI cards
- **Charts/** - Specialized chart components:
  - `TrendChart.tsx` - Balance trends with forecasting
  - `BudgetChart.tsx` - Budget vs actual spending analysis
  - `SankeyView.tsx` - Money flow visualization
- **GoalsPanel.tsx** - Financial goal tracking with progress indicators

### 🎨 Design System

- **colors.ts** - Accessibility-focused color system based on ColorBrewer palettes
- WCAG AA compliant contrast ratios
- Colorblind-safe palette selection
- Dark mode ready color tokens

## Accessibility Features

### WCAG 2.1 AA Compliance

✅ **Keyboard Navigation**
- All interactive elements are keyboard accessible
- Logical tab order throughout the dashboard
- Focus indicators on all focusable elements

✅ **Screen Reader Support**
- Proper ARIA labels and roles
- Hidden data tables for chart content
- Semantic HTML structure
- Descriptive alt text and long descriptions

✅ **Color and Contrast**
- 4.5:1 contrast ratio for normal text
- 3:1 contrast ratio for UI elements
- Colorblind-safe palettes
- Pattern fallbacks for color-dependent information

✅ **Progressive Disclosure**
- Essential information shown by default
- Expandable sections for detailed data
- Clear visual hierarchy

### Mobile Accessibility

- Minimum 44px tap targets
- Swipe gestures with keyboard alternatives
- Responsive text sizing
- Touch-friendly interface elements

## Research-Based Design Decisions

### Visual Encoding Principles

1. **Position Encoding** - Used for trend charts as it's the most accurate visual encoding
2. **Length Encoding** - Bar charts for budget comparisons
3. **Color Encoding** - Semantic colors (red/green) for variance indicators
4. **Sequential Color Scales** - For continuous data (balance trends)
5. **Diverging Color Scales** - For variance data (over/under budget)

### Cognitive Load Reduction

- **Progressive Disclosure** - Complex information hidden behind interaction
- **Chunking** - Information grouped in logical sections
- **Consistent Patterns** - Repeated interaction patterns across components
- **Clear Hierarchy** - Visual weight guides attention

### Evidence-Based UX Patterns

- **Loss Aversion Framing** - "At this rate, you'll run out in X days"
- **Social Proof** - Goal progress comparisons
- **Immediate Feedback** - Real-time updates and confirmations
- **Micro-interactions** - Smooth transitions and hover states

## Technical Implementation

### Performance Optimizations

- **Lazy Loading** - Charts rendered on demand
- **Memoization** - React.memo and useMemo for expensive calculations
- **Virtual Scrolling** - For large data sets
- **Debounced Interactions** - Smooth user experience

### Analytics & Privacy

- **Minimal PII Collection** - No personal financial data tracked
- **Interaction Analytics** - UX improvement focused
- **Local Processing** - Sensitive calculations client-side
- **GDPR Compliant** - Privacy-first approach

### Testing Strategy

- **Unit Tests** - Component functionality
- **Accessibility Tests** - ARIA compliance
- **Visual Regression** - Design consistency
- **Performance Tests** - Load time monitoring

## Usage

### Basic Implementation

```tsx
import FinanceDashboard from './components/FinanceDashboard';
import { getDashboardAnalytics } from './lib/dashboardAnalytics';

function App() {
  const analytics = getDashboardAnalytics();

  return (
    <FinanceDashboard
      currency="₹"
      onAnalyticsTrack={analytics.track}
    />
  );
}
```

### Mobile Layout

```tsx
import PhoneLayout from './components/PhoneLayout';

function MobileApp() {
  return (
    <PhoneLayout
      kpiData={kpiData}
      currency="₹"
      onKPIClick={handleKPIClick}
      onActionClick={handleActionClick}
    />
  );
}
```

### Custom Chart Integration

```tsx
import { TrendChart, BudgetChart, SankeyView } from './components/charts';

function CustomDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TrendChart data={trendData} aria-labelledby="trend-title" />
      <BudgetChart data={budgetData} currency="$" />
      <SankeyView data={flowData} />
    </div>
  );
}
```

## Customization

### Color System

```typescript
import { chartColors, getCategoryColor, isColorAccessible } from './styles/colors';

// Check if color combination is accessible
const isAccessible = isColorAccessible('#000000', '#ffffff'); // true

// Get category color with pattern fallback
const categoryStyle = getCategoryColor(0, true); // { color: '#66c2a5', pattern: 'solid' }
```

### Analytics Configuration

```typescript
import { trackKPIInteraction, trackChartInteraction } from './lib/dashboardAnalytics';

// Track user interactions
trackKPIInteraction('available_cash', 'click');
trackChartInteraction('trend', 'filter', { period: '30d' });
```

## Browser Support

- **Modern Browsers** - Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Browsers** - iOS Safari 13+, Chrome Mobile 80+
- **Accessibility Tools** - NVDA, JAWS, VoiceOver compatible

## Dependencies

### Core Dependencies
- React 18.3+
- TypeScript 5.5+
- Tailwind CSS 3.4+
- Recharts 2.15+ (charts)
- date-fns 3.6+ (date utilities)

### Development Dependencies
- Jest (testing)
- @testing-library/react (component testing)
- @testing-library/jest-dom (DOM assertions)

## Performance Benchmarks

- **First Contentful Paint** - < 1.2s
- **Largest Contentful Paint** - < 2.5s
- **Cumulative Layout Shift** - < 0.1
- **First Input Delay** - < 100ms

## Accessibility Testing

Run accessibility tests with:

```bash
npm run test:a11y
```

This includes:
- Automated WCAG compliance checks
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation

## Contributing

When contributing to the dashboard:

1. **Accessibility First** - All new features must meet WCAG AA standards
2. **Mobile Responsive** - Test on mobile devices
3. **Performance** - Monitor bundle size and render performance
4. **Testing** - Add tests for new functionality
5. **Documentation** - Update README for new features

## Research References

1. **Cleveland, W.S. & McGill, R.** (1984). Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods. *Journal of the American Statistical Association*, 79(387), 531-554.

2. **Ware, C.** (2019). *Information Visualization: Perception for Design*. 4th Edition. Morgan Kaufmann.

3. **Few, S.** (2012). *Show Me the Numbers: Designing Tables and Graphs to Enlighten*. 2nd Edition. Analytics Press.

4. **Tufte, E.R.** (2001). *The Visual Display of Quantitative Information*. 2nd Edition. Graphics Press.

5. **Nielsen, J.** (2000). Designing Web Usability. New Riders Publishing.

6. **Kahneman, D. & Tversky, A.** (1984). Choices, values, and frames. *American Psychologist*, 39(4), 341-350.

7. **W3C Web Accessibility Initiative** (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/WAI/WCAG21/

8. **Brewer, C.A.** (2016). *ColorBrewer 2.0*. https://colorbrewer2.org/

## License

MIT License - see LICENSE file for details.
