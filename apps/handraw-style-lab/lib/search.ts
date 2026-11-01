export type Searchable = {
  id: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  family?: string;
};

export function matchesQuery(item: Searchable, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    item.id,
    item.name.zh,
    item.name.en,
    item.description.zh,
    item.description.en,
    item.family ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((part) => hay.includes(part));
}

export function filterCatalog<T extends Searchable>(items: T[], query: string): T[] {
  return items.filter((item) => matchesQuery(item, query));
}
