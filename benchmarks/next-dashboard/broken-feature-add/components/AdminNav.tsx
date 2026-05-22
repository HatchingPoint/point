import Link from "next/link";

const links = [
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/search", label: "Search" },
];

export function AdminNav() {
  return (
    <nav className="admin-nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
      <span>Dashboard</span>
    </nav>
  );
}
