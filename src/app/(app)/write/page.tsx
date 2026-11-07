import type { Metadata } from "next";
import { WriteView } from "@/features/write/write-view";

export const metadata: Metadata = { title: "Write · Snakk" };

// Owner: T12. The real UI lives in src/features/write/.
export default function Page() {
  return <WriteView />;
}
