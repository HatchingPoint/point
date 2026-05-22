import { NotesNav } from "../../components/NotesNav";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <aside>
        <NotesNav />
      </aside>
      <main>{children}</main>
    </div>
  );
}
