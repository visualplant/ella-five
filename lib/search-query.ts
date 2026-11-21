export const MIN_QUERY = 3;

export function isSearchReady(value: string, min = MIN_QUERY): boolean {
  return value.trim().length >= min;
}

export function shouldOpenSuggestions(expanded: boolean, value: string): boolean {
  return expanded && isSearchReady(value);
}

export function searchFilter(
  item: { label?: string; value: string; keywords?: string[] },
  query: string,
): boolean {
  if (!isSearchReady(query)) return false;
  const q = query.trim().toLowerCase();
  const hay = [item.label, item.value, ...(item.keywords ?? [])].join(" ").toLowerCase();
  return hay.includes(q);
}
