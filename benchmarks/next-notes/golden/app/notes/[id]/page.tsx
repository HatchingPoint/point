import { NoteDetail } from "../../../components/NoteDetail";

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  return (
    <section>
      <h1>Note detail</h1>
      <NoteDetail id={params.id} />
    </section>
  );
}
