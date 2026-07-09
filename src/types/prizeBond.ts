export type PrizeBond = {
  id: string;
  bond_number: string;
  denomination: number;
  created_at: string;
  updated_at: string;
};

export type PrizeBondWin = {
  id: string;
  bond_id: string;
  bond_number: string;
  prize_tier: string;
  prize_amount: number;
  draw_date: string;
  series?: string;
  notified_at?: string;
  created_at: string;
};

export type PbrisCheckResult = {
  bond_number: string;
  prize_tier: string;
  prize_amount: number;
  draw_date: string;
  series?: string;
};

export type PrizeBondScanFeedback = {
  detected_number: string;
  confirmed_number: string;
  best_region?: string;
  region_scores?: Record<string, number>;
};

export type ScanLearnHints = {
  regionBoost: Record<string, number>;
  corrections: Map<string, string>;
};

export type BondOcrResult = {
  number: string | null;
  scores: Record<string, number>;
  best_region?: string;
  feedback: PrizeBondScanFeedback | null;
};
