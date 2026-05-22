import Link from "next/link";

const links = [
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/products", label: "Products" },
];

export function AdminNav() {
  return (
    <nav className="admin-nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
