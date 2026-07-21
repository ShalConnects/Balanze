export function isActiveLendBorrow(lb: unknown): boolean;
export function filterActiveLendBorrow(rows: unknown[]): unknown[];
export function lendBorrowReturned(lb: unknown): number;
export function lendBorrowRemaining(lb: unknown): number;
export function isLentType(lb: unknown): boolean;
export function isBorrowedType(lb: unknown): boolean;
export function rollupLendBorrowByCurrency(rows: unknown[], options?: { alreadyActive?: boolean }): unknown[];
export function isActiveBusinessContract(c: unknown): boolean;
export function filterActiveBusinessContracts(rows: unknown[]): unknown[];
