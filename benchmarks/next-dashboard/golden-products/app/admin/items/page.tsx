import { ItemsList } from "../../../components/ItemsList";
import { fetchItems } from "../../../lib/items";

export default async function ItemsPage() {
  const items = await fetchItems();
  return (
    <section>
      <h1>Items</h1>
      <p>Browse tracked items</p>
      <ItemsList items={items} />
    </section>
  );
}
