import type { CapacitorGlobal } from '@capacitor/core';

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
    va?: ((event: string, properties?: unknown) => void) & {
      track?: (event: string, properties?: unknown) => void;
    };
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }

  interface CSSStyleDeclaration {
    webkitOverflowScrolling?: string;
    WebkitOverflowScrolling?: string;
  }
}

declare module '../../lib/lastWishIncludeData.js';
declare module '../../lib/lastWishDataFilters.js';
declare module '../../../lib/lastWishIncludeData.js';
declare module '../../../lib/lastWishDataFilters.js';
declare module '../../lib/prizeBondShared.js';

export {};
