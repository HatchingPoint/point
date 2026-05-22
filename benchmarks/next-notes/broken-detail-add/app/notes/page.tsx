import { NotesList } from "../../../components/NotesList";
import { listNotes } from "../../../lib/notes";

export default async function NotesPage() {
  const notes = await listNotes();
  return (
    <section>
      <h1>Notes</h1>
      <NotesList notes={notes} />
    </section>
  );
}
