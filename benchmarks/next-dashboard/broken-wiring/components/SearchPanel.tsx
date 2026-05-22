import { searchItem } from "../lib/searchItems";

export async function SearchPanel() {
  const items = await searchItem("");
  return <p>Search results</p>;
}
