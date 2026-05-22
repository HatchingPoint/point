import type { Product } from "./types";

export function sampleProducts(): Product[] {
  return [
    { id: "alpha", title: "Alpha" },
    { id: "beta", title: "Beta" },
    { id: "gamma", title: "Gamma" },
  ];
}

export async function listProducts(): Promise<Product[]> {
  return sampleProducts();
}
