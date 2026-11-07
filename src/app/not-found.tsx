import type { Metadata } from "next";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found · Snakk" };

/** Any unknown URL: friendly, and always a way back (a beginner must never get stuck). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Mascot className="h-28 w-28" />
      <p className="text-sm font-bold uppercase tracking-wide text-brand">404</p>
      <h1 className="font-display text-3xl font-bold">
        <span lang="nb">«Hæ?»</span> We can&apos;t find that page.
      </h1>
      <p className="text-muted">The link may be old or mistyped. Let&apos;s get you back to learning.</p>
      <div className="flex w-full flex-col gap-2">
        <Button href="/learn" size="lg">
          🏠 Back to Snakk
        </Button>
        <Button href="/phrases" variant="secondary">
          💬 Open the phrasebook
        </Button>
      </div>
    </main>
  );
}
