/** Shared with dashboard Investments UI + Last Wish delivery (principal = initial + capital contributions). */

export function sumCapitalContributions(contract) {
  return (contract?.entries || [])
    .filter((e) => e.type === 'capital_contribution')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
}

export function getEffectivePrincipal(contract) {
  return (Number(contract?.principal) || 0) + sumCapitalContributions(contract);
}
