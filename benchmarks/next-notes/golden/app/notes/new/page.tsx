import { NoteCreateForm } from "../../../components/NoteCreateForm";

const draft = { title: "", body: "" };

export default function NewNotePage() {
  return (
    <section>
      <h1>New note</h1>
      <NoteCreateForm draft={draft} onDraftChange={() => undefined} />
    </section>
  );
}
