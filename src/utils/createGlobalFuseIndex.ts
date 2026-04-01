import Fuse from 'fuse.js';

/** Shared Fuse options for header global search — single source of truth (DRY). */
export function createGlobalFuseIndex<T>(
  items: readonly T[] | null | undefined,
  keys: Array<{ name: string; weight: number }>,
  threshold = 0.3
) {
  return new Fuse(items ?? [], {
    threshold,
    keys,
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    // Extended mode breaks plain fuzzy matches for short queries (e.g. asset names).
    useExtendedSearch: false,
  });
}
