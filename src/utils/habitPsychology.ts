/** Habit formation: Lally et al. (2009) ~66 days typical automaticity; 21 days is an early checkpoint, not a finish line. */

export const HABIT_FORMATION_DAYS = 66;
export const EARLY_GROOVE_DAYS = 21;
export const IDENTITY_DAYS = 100;
export const GRACE_WINDOW_DAYS = 7;
export const HABIT_CUE_PLACEHOLDER = 'After I [cue], I will [tiny action] for 2 minutes';
export const HABIT_FORM_HINT = 'Start so small you can do it on a bad day. 1–3 habits stick better than 10.';

const DAY_MS = 86_400_000;

export type PlantStage = 'seed' | 'sprout' | 'small' | 'medium' | 'large' | 'mature';

const STAGES: PlantStage[] = ['seed', 'sprout', 'small', 'medium', 'large', 'mature'];

export const toDayNum = (iso: string): number => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
};

export const uniqueDayNums = (dates: string[]): number[] =>
  [...new Set(dates.map(toDayNum))].sort((a, b) => a - b);

export const automaticityLabel = (practiceDays: number): string => {
  if (practiceDays < EARLY_GROOVE_DAYS) return 'Cue forming';
  if (practiceDays < HABIT_FORMATION_DAYS) return 'Early groove';
  if (practiceDays < IDENTITY_DAYS) return 'Getting automatic';
  return 'Part of who you are';
};

export const getPlantStage = (practiceDays: number): PlantStage => {
  if (practiceDays <= 0) return 'seed';
  if (practiceDays < 7) return 'sprout';
  if (practiceDays < EARLY_GROOVE_DAYS) return 'small';
  if (practiceDays < HABIT_FORMATION_DAYS) return 'medium';
  if (practiceDays < IDENTITY_DAYS) return 'large';
  return 'mature';
};

export const dropPlantStage = (stage: PlantStage): PlantStage =>
  STAGES[Math.max(0, STAGES.indexOf(stage) - 1)];

export function currentStreak(dates: string[], todayIso: string): number {
  const days = new Set(uniqueDayNums(dates));
  const today = toDayNum(todayIso);
  let cursor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  if (cursor == null) return 0;
  let streak = 0;
  let lastGrace = Infinity;
  for (;;) {
    if (days.has(cursor)) {
      streak++;
      cursor--;
      continue;
    }
    if (days.has(cursor - 1) && lastGrace - cursor >= GRACE_WINDOW_DAYS) {
      lastGrace = cursor;
      cursor--;
      continue;
    }
    break;
  }
  return streak;
}

export function bestStreak(dates: string[]): number {
  const nums = uniqueDayNums(dates);
  if (!nums.length) return 0;
  let best = 1;
  let cur = 1;
  let lastGrace = -Infinity;
  for (let i = 1; i < nums.length; i++) {
    const gap = nums[i] - nums[i - 1];
    const missed = nums[i] - 1;
    if (gap === 1) {
      cur++;
    } else if (gap === 2 && missed - lastGrace >= GRACE_WINDOW_DAYS) {
      lastGrace = missed;
      cur++;
    } else {
      cur = 1;
      lastGrace = -Infinity;
    }
    best = Math.max(best, cur);
  }
  return best;
}

export function automaticity(dates: string[], createdAtIso: string, todayIso: string) {
  const today = toDayNum(todayIso);
  const created = toDayNum(createdAtIso);
  const start = Math.max(created, today - HABIT_FORMATION_DAYS + 1);
  const windowDays = Math.max(1, today - start + 1);
  const set = new Set(uniqueDayNums(dates));
  let practiceDays = 0;
  for (let d = start; d <= today; d++) if (set.has(d)) practiceDays++;
  return {
    practiceDays,
    windowDays,
    towardFormation: Math.min(100, Math.round((practiceDays / HABIT_FORMATION_DAYS) * 100)),
    consistency: Math.round((practiceDays / windowDays) * 100),
    label: automaticityLabel(practiceDays),
  };
}

export function daysSinceLast(dates: string[], todayIso: string): number | null {
  const nums = uniqueDayNums(dates);
  if (!nums.length) return null;
  return toDayNum(todayIso) - nums[nums.length - 1];
}

export function isHabitDying(dates: string[], todayIso: string): boolean {
  const gap = daysSinceLast(dates, todayIso);
  return gap != null && gap >= 2 && gap <= 14;
}

export function plantStageFor(dates: string[], createdAtIso: string, todayIso: string): PlantStage {
  const { practiceDays } = automaticity(dates, createdAtIso, todayIso);
  const stage = getPlantStage(practiceDays);
  const gap = daysSinceLast(dates, todayIso) ?? 0;
  return gap >= 3 && practiceDays > 0 ? dropPlantStage(stage) : stage;
}
