import type { CreateNoteInput, Note } from "./types";

export function sampleNotes(): Note[] {
  return [
    { id: "n1", title: "Hello", body: "World" },
    { id: "n2", title: "Draft", body: "Work in progress" },
  ];
}

export async function listNotes(): Promise<Note[]> {
  return sampleNotes();
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  return { id: "new", title: input.title, body: input.body };
}
