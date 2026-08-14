import type { EntryType, InvestmentContract } from '../types/businessInvestment';
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

function sumByType(contract: InvestmentContract, type: EntryType) {
  return contract.entries.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0);
}

export function getContractStats(contract: InvestmentContract) {
  const totalProfit = sumByType(contract, 'profit');
  const totalLoss = sumByType(contract, 'loss');
  const principalReturned = sumByType(contract, 'principal_return');
  const effectivePrincipal = getEffectivePrincipal(contract);
  const outstanding = Math.max(0, effectivePrincipal - principalReturned - totalLoss);
  return {
    totalProfit,
    totalLoss,
    principalReturned,
    outstanding,
    netResult: totalProfit - totalLoss - outstanding,
    effectivePrincipal,
    capitalContributed: effectivePrincipal - contract.principal,
  };
}

/** Loss and principal return both draw from the same remaining capital. */
export function entryExceedsOutstanding(type: EntryType, amount: number, outstanding: number): boolean {
  return (type === 'loss' || type === 'principal_return') && Math.round(amount * 100) > Math.round(outstanding * 100);
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
