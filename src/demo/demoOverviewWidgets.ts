import type { DemoStat } from '../constants/productAreas';
import { DEMO_OVERVIEW_WIDGETS } from '../constants/productAreas';

export type { DemoStat };
export type DemoOverviewWidget = { id: string; title: string; stats: DemoStat[] };

export const DEMO_STATIC_WIDGETS: DemoOverviewWidget[] = DEMO_OVERVIEW_WIDGETS;

export function purchasesOverviewStats(
  planned: number,
  purchased: number,
  cancelled: number,
  plannedValue: number,
  formatCurrency: (n: number, c: string) => string
): DemoStat[] {
  return [
    { title: 'Planned', value: String(planned), color: 'yellow' },
    { title: 'Purchased', value: String(purchased), color: 'green' },
    { title: 'Cancelled', value: String(cancelled), color: 'red' },
    { title: 'Planned value', value: formatCurrency(plannedValue, 'USD'), color: 'blue' },
  ];
}
