type ItemDetailProps = {
  id: string;
};

export function ItemDetail({ id }: ItemDetailProps) {
  return <p>Item detail for {id}</p>;
}
