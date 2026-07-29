export function sumCapitalContributions(contract: {
  entries?: Array<{ type: string; amount: number }>;
}): number;
export function getEffectivePrincipal(contract: {
  principal?: number;
  entries?: Array<{ type: string; amount: number }>;
}): number;
