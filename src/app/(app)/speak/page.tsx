import { Suspense } from "react";
import { PronunciationPractice } from "@/features/pronunciation/pronunciation-practice";
import { SpeakView } from "@/features/speak/speak-view";

// Owner: T2. The real UI lives in src/features/speak/.
// T5: <PronunciationPractice /> stays on this page, below the tutor.
// Suspense: the chosen scenario comes from the URL (?scenario=kiosk), only known in the browser.
export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-surface-2" aria-busy="true" aria-label="Loading scenarios" />}>
        <SpeakView />
      </Suspense>
      <PronunciationPractice />
    </div>
  );
}
