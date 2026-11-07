import type { Metadata } from "next";
import { TandemView } from "@/features/tandem/tandem-view";

export const metadata: Metadata = { title: "Tandem · Snakk" };

// Owner: T10. The real UI lives in src/features/tandem/.
export default function Page() {
  return <TandemView />;
}
