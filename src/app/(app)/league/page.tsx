import type { Metadata } from "next";
import { LeagueView } from "@/features/league/league-view";

export const metadata: Metadata = { title: "League · Snakk" };

// Owner: T9. The real UI lives in src/features/league/.
export default function Page() {
  return <LeagueView />;
}
