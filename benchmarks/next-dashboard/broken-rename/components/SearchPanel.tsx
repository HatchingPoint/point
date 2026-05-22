import { searchItems } from "../lib/searchItems";

export async function SearchPanel() {
  const items = await searchItems("");
  if (items.length === 0) return <p>No matches</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
