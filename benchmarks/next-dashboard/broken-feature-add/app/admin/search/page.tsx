import { SearchPanel } from "../../../components/SearchPanel";

export default async function SearchPage() {
  return (
    <section>
      <h1>Search</h1>
      <p>Find items by title</p>
      <SearchPanel />
    </section>
  );
}
