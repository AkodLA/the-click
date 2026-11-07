import type { Metadata } from "next";
import { Suspense } from "react";
import { WordsView } from "@/features/words/words-view";

export const metadata: Metadata = { title: "My words · Snakk" };

// Owner: T20. The real UI lives in src/features/words/.
// Suspense: the open pack comes from the URL (?pack=logistics), only known in the browser.
export default function Page() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-surface-2" aria-busy="true" aria-label="Loading your words" />}>
      <WordsView />
    </Suspense>
  );
}
