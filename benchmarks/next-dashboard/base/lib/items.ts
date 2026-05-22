import type { Item } from "./types";

export function sampleItems(): Item[] {
  return [
    { id: "alpha", title: "Alpha" },
    { id: "beta", title: "Beta" },
    { id: "gamma", title: "Gamma" },
  ];
}

export async function fetchItems(): Promise<Item[]> {
  return sampleItems();
}
