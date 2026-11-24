"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ slug, name, href }: { name: string; slug?: string; href?: string }) {
  const path = usePathname() || "";
  const to = href || `/${slug}`;
  const exact = path === to;
  const active = exact || (to !== "/" && path.startsWith(to + "/"));
  return (
    <Link href={to} className={active ? "is-active" : undefined} aria-current={exact ? "page" : undefined}>
      {name}
    </Link>
  );
}
