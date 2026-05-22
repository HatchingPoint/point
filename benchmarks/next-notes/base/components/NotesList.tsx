import type { Note } from "../lib/types";

export function NotesList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return <p>No notes yet</p>;
  return <p>Notes</p>;
}
