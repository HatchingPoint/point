import Link from "next/link";

const links = [
  { href: "/notes", label: "Notes" },
  { href: "/notes/new", label: "New note" },
];

export function NotesNav() {
  return (
    <nav>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
