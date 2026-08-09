"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, ScanLine, LogOut, Music, CalendarCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarCog },
  { href: "/admin/scan", label: "Scan Tickets", icon: ScanLine },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-navy-50/40">
      <header className="border-b border-border bg-navy-950 text-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Music className="h-5 w-5 text-gold" />
              <span className="font-serif font-semibold">
                Commontone <span className="text-white/50">Admin</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-gold"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        {/* Mobile nav */}
        <nav className="container flex gap-1 pb-2 sm:hidden">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  active ? "bg-white/10 text-gold" : "text-white/70",
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
