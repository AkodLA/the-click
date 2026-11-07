import type { Metadata } from "next";
import { EventsView } from "@/features/events/events-view";

export const metadata: Metadata = { title: "Språkkafé events · Snakk" };

// Owner: T11. The real UI lives in src/features/events/.
export default function Page() {
  return <EventsView />;
}
