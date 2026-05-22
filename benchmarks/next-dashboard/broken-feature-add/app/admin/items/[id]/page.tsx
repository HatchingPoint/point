import { ItemDetail } from "../../../../components/ItemDetail";

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  return (
    <section>
      <h1>Item Detail</h1>
      <p>Inspect a single item</p>
      <ItemDetail id={params.id} />
    </section>
  );
}
