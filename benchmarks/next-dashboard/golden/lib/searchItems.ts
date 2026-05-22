import { sampleItems } from "./items";

export async function searchItems(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sampleItems();
  return sampleItems().filter((item) => item.title.toLowerCase().includes(normalized));
}
