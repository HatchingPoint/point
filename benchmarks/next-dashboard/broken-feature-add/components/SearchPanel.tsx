import { searchItems } from "../lib/searchItems";

export async function SearchPanel() {
  const items = await searchItems("");
  return <p>Search results</p>;
}
