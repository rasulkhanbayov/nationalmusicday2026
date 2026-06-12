import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[70vh] items-center justify-center bg-navy-50/30">
        <div className="container text-center">
          <p className="section-eyebrow">404</p>
          <h1 className="font-serif text-4xl font-bold text-navy-900">
            Page Not Found
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get
            you back to the music.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild variant="gold">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/seats">Buy Tickets</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
