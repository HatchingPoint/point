import { getNote } from "../lib/getNote";

export async function NoteDetail({ id }: { id: string }) {
  const note = await getNote(id);
  return <p>{note.title}</p>;
}
