export const PRIZE_BOND_DENOMINATION: number;
export const PRIZE_BOND_BATCH_SIZE: number;
export const PRIZE_BOND_PAGE_SIZE: number;
export function getDrawSchedule(reference?: Date): { next: Date; previous: Date };
export function isPrizeBondDrawDay(date?: Date): boolean;
