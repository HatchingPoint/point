import Link from "next/link";
import type { Product } from "../lib/types";

export function ProductsList({ products }: { products: Product[] }) {
  if (products.length === 0) return <p>No products yet</p>;
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <Link href={`/admin/products/${product.id}`}>{product.title}</Link>
        </li>
      ))}
    </ul>
  );
}
