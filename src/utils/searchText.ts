export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export const includesNormalized = (source: string | null | undefined, query: string) => {
  if (!query) return true;
  if (!source) return false;
  return normalizeSearchText(source).includes(query);
};
