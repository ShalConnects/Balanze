/**
 * Accessibility-focused color system based on ColorBrewer palettes
 * Ensures WCAG AA compliance and colorblind-safe design
 */

// ColorBrewer Sequential Blues for trend data
export const sequentialBlue = {
  50: '#f0f9ff',
  100: '#e0f2fe', 
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e'
} as const;

// ColorBrewer Diverging Red/Green for budget variance
export const divergingNegPos = {
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  }
} as const;

// ColorBrewer Qualitative Set2 for categories (colorblind-safe)
export const qualitativeCategories = [
  '#66c2a5', // teal
  '#fc8d62', // orange
  '#8da0cb', // purple
  '#e78ac3', // pink
  '#a6d854', // lime
  '#ffd92f', // yellow
  '#e5c494', // tan
  '#b3b3b3'  // gray
] as const;

// Neutral grays for UI elements
export const neutrals = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827'
} as const;

// Alert colors
export const alerts = {
  error: '#dc2626',
  warning: '#d97706',
  success: '#059669',
  info: '#0284c7'
} as const;

/**
 * Checks if color combination meets WCAG AA contrast requirements
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns boolean indicating if contrast ratio >= 4.5:1
 */
export function isColorAccessible(foreground: string, background: string): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05) >= 4.5;
}

/**
 * Gets accessible text color for given background
 * @param backgroundColor - Background color (hex)
 * @returns Accessible text color
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  return isColorAccessible('#000000', backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Gets category color by index with fallback patterns for accessibility
 * @param index - Category index
 * @param usePattern - Whether to use pattern fallback for colorblind users
 * @returns Color and optional pattern information
 */
export function getCategoryColor(index: number, usePattern = false): {
  color: string;
  pattern?: string;
} {
  const color = qualitativeCategories[index % qualitativeCategories.length];
  
  if (usePattern) {
    const patterns = ['solid', 'diagonal', 'dots', 'horizontal', 'vertical', 'cross', 'grid'];
    return {
      color,
      pattern: patterns[index % patterns.length]
    };
  }
  
  return { color };
}

/**
 * Chart color schemes for different visualization types
 */
export const chartColors = {
  trend: {
    primary: sequentialBlue[600],
    secondary: sequentialBlue[400],
    forecast: sequentialBlue[300],
    background: sequentialBlue[50]
  },
  budget: {
    over: divergingNegPos.red[500],
    under: divergingNegPos.green[500],
    neutral: neutrals[400]
  },
  kpi: {
    positive: divergingNegPos.green[600],
    negative: divergingNegPos.red[600],
    neutral: neutrals[600]
  }
} as const;

export default {
  sequentialBlue,
  divergingNegPos,
  qualitativeCategories,
  neutrals,
  alerts,
  chartColors,
  isColorAccessible,
  getAccessibleTextColor,
  getCategoryColor
};
