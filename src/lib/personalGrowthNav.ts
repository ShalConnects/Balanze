export const PERSONAL_GROWTH_COMPOSE = 'compose';

export function personalGrowthPath(tab: string, extra?: Record<string, string>) {
  return `/personal-growth?${new URLSearchParams({ tab, ...extra })}`;
}
