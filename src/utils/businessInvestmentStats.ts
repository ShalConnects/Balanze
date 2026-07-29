import type { InvestmentContract } from '../types/businessInvestment';
import {
  getEffectivePrincipal as getEffectivePrincipalShared,
  sumCapitalContributions as sumCapitalContributionsShared,
} from '../../lib/businessInvestmentStats.js';

export function sumCapitalContributions(contract: InvestmentContract) {
  return sumCapitalContributionsShared(contract);
}

/** Initial principal from contract row plus capital_contribution entries. */
export function getEffectivePrincipal(contract: InvestmentContract) {
  return getEffectivePrincipalShared(contract);
}

export function getContractStats(contract: InvestmentContract) {
  const totalProfit = contract.entries.filter((e) => e.type === 'profit').reduce((s, e) => s + e.amount, 0);
  const totalLoss = contract.entries.filter((e) => e.type === 'loss').reduce((s, e) => s + e.amount, 0);
  const principalReturned = contract.entries
    .filter((e) => e.type === 'principal_return')
    .reduce((s, e) => s + e.amount, 0);
  const effectivePrincipal = getEffectivePrincipal(contract);
  const netResult = totalProfit - totalLoss + (principalReturned - effectivePrincipal);
  return {
    totalProfit,
    totalLoss,
    principalReturned,
    netResult,
    effectivePrincipal,
    capitalContributed: effectivePrincipal - contract.principal,
  };
}

/** Active contracts only; when `currency` is empty, all active contracts are included. */
export function aggregateActiveInvestmentSummary(contracts: InvestmentContract[], currency: string) {
  const list = contracts.filter((c) => c.status === 'active' && (!currency || c.currency === currency));
  let totalPrincipal = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let overallNet = 0;
  for (const c of list) {
    const s = getContractStats(c);
    totalPrincipal += s.effectivePrincipal;
    totalProfit += s.totalProfit;
    totalLoss += s.totalLoss;
    overallNet += s.netResult;
  }
  return { activeCount: list.length, totalPrincipal, totalProfit, totalLoss, overallNet };
}
