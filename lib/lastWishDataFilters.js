/** Active Last Wish delivery filters + outstanding amount helpers (shared server/UI). */

export function isActiveLendBorrow(lb) {
  return lb?.status === 'active' || lb?.status === 'overdue';
}

export function filterActiveLendBorrow(rows) {
  return (rows || []).filter(isActiveLendBorrow);
}

export function lendBorrowReturned(lb) {
  return parseFloat(lb?.total_returned_amount) || parseFloat(lb?.partial_return_amount) || 0;
}

export function lendBorrowRemaining(lb) {
  return Math.max(0, (parseFloat(lb?.amount) || 0) - lendBorrowReturned(lb));
}

export function isLentType(lb) {
  return lb?.type === 'lend' || lb?.type === 'lent';
}

export function isBorrowedType(lb) {
  return lb?.type === 'borrow' || lb?.type === 'borrowed';
}

/** Outstanding lent/borrowed totals by currency (expects active rows, or pass any and filter). */
export function rollupLendBorrowByCurrency(rows, { alreadyActive = false } = {}) {
  const active = alreadyActive ? rows || [] : filterActiveLendBorrow(rows);
  const lentByCurrency = {};
  const borrowedByCurrency = {};
  for (const lb of active) {
    const rem = lendBorrowRemaining(lb);
    if (rem <= 0) continue;
    const cur = lb.currency || 'USD';
    if (isLentType(lb)) lentByCurrency[cur] = (lentByCurrency[cur] || 0) + rem;
    else if (isBorrowedType(lb)) borrowedByCurrency[cur] = (borrowedByCurrency[cur] || 0) + rem;
  }
  return { active, lentByCurrency, borrowedByCurrency, count: active.length };
}

export function isActiveBusinessContract(c) {
  return c?.status === 'active';
}

export function filterActiveBusinessContracts(rows) {
  return (rows || []).filter(isActiveBusinessContract);
}
