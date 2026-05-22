import Link from "next/link";
import type { Item } from "../lib/types";

export function ItemsList({ items }: { items: Item[] }) {
  if (items.length === 0) return <p>No items yet</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/admin/items/${item.id}`}>{item.title}</Link>
        </li>
      ))}
    </ul>
  );
}
