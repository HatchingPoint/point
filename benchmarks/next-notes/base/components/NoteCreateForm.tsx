"use client";

import type { CreateNoteInput } from "../lib/types";

export function NoteCreateForm({
  draft,
  onDraftChange,
}: {
  draft: CreateNoteInput;
  onDraftChange: (draft: CreateNoteInput) => void;
}) {
  return (
    <form>
      <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} />
      <textarea value={draft.body} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} />
    </form>
  );
}
