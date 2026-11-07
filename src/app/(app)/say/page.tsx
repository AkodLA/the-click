import type { Metadata } from "next";
import { SayView } from "@/features/say/say-view";

export const metadata: Metadata = { title: "Say it in Norwegian · Snakk" };

// Owner: T23. Say or type it in English → Norwegian text or voice message (src/features/say/).
export default function Page() {
  return <SayView />;
}
