import { Suspense } from "react";
import { Phrasebook, PhrasebookSkeleton } from "@/features/phrases/phrasebook";

// Owner: T7. The real UI lives in src/features/phrases/.
// Suspense: the filters come from the URL (?register=slang&level=A2), which is only known in the browser.
export default function Page() {
  return (
    <Suspense fallback={<PhrasebookSkeleton />}>
      <Phrasebook />
    </Suspense>
  );
}
