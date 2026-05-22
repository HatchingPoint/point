type NoteDetailProps = {
  id: string;
};

export function NoteDetail({ id }: NoteDetailProps) {
  return <p>Note detail for {id}</p>;
}
