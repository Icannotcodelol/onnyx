"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui";
import { ThemeToggle } from "./ThemeToggle";
import Image from "next/image";

const links = [
  { href: "/", label: "Today" },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Leaderboard" }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-white/10 bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
          <Image src="/logo.svg" alt="AutoBench" width={32} height={32} className="drop-shadow-lg" />
          AutoBench
        </Link>
        <nav className="flex items-center gap-6 text-sm uppercase tracking-wide">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors",
                pathname === link.href ? "text-brand-200" : "text-slate-300 hover:text-brand-200"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
