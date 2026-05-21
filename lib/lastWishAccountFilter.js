/** @param {{ account_id?: string, id?: string }} acc */
export function lastWishAccountId(acc) {
  return acc.account_id ?? acc.id;
}

/** Drop DPS savings accounts whose parent no longer has DPS enabled (dashboard parity). */
export function filterOrphanDpsSavingsAccounts(accounts) {
  const list = accounts || [];
  return list.filter((acc) => {
    const id = lastWishAccountId(acc);
    const parent = list.find((a) => a.dps_savings_account_id === id);
    if (parent) return parent.has_dps === true;
    if (acc.name?.includes('(DPS)')) {
      return list.some((a) => a.has_dps && a.dps_savings_account_id === id);
    }
    return true;
  });
}
