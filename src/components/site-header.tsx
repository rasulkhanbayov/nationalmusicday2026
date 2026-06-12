"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#about", label: "About" },
  { href: "/#artists", label: "Artists" },
  { href: "/#program", label: "Program" },
  { href: "/#venue", label: "Venue" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/90 backdrop-blur supports-[backdrop-filter]:bg-navy-950/80">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white"
          aria-label="National Music Day 2026 home"
        >
          <Music className="h-5 w-5 text-gold" />
          <span className="font-serif text-lg font-semibold tracking-tight">
            National Music Day{" "}
            <span className="text-gold">2026</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild variant="gold" size="sm">
            <Link href="/seats">Buy Tickets</Link>
          </Button>
        </nav>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden",
          open ? "block border-t border-white/10" : "hidden",
        )}
      >
        <nav className="container flex flex-col gap-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild variant="gold" size="sm" className="mt-2">
            <Link href="/seats" onClick={() => setOpen(false)}>
              Buy Tickets
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
