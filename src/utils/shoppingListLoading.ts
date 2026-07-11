let loading = false;
const listeners = new Set<() => void>();

export function setShoppingListLoading(active: boolean) {
  if (loading === active) return;
  loading = active;
  listeners.forEach((l) => l());
}

export function getShoppingListLoading() {
  return loading;
}

export function subscribeShoppingListLoading(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}
