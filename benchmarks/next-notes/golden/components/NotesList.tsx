import Link from "next/link";
import type { Note } from "../lib/types";

export function NotesList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return <p>No notes yet</p>;
  return (
    <ul>
      {notes.map((note) => (
        <li key={note.id}>
          <Link href={`/notes/${note.id}`}>{note.title}</Link>
        </li>
      ))}
    </ul>
  );
}
