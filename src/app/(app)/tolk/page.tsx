import type { Metadata } from "next";
import { TolkView } from "@/features/tolk/tolk-view";

export const metadata: Metadata = { title: "Tolk interpreter · Snakk" };

// Owner: T8. The real UI lives in src/features/tolk/.
export default function Page() {
  return <TolkView />;
}
