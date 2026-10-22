"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ slug, name }: { slug: string; name: string }) {
  const path = usePathname() || "";
  const exact = path === `/${slug}`;
  const active = exact || path.startsWith(`/${slug}/`);
  return (
    <Link href={`/${slug}`} className={active ? "is-active" : undefined} aria-current={exact ? "page" : undefined}>
      {name}
    </Link>
  );
}
