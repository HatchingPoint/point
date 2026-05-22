import { sampleNotes } from "./notes";

export async function getNote(id: string) {
  return sampleNotes().find((note) => note.id === id) ?? { id, title: `Note ${id}`, body: `Detail for ${id}` };
}
