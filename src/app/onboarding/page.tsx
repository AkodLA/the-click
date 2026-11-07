import type { Metadata } from "next";
import { PlacementFlow } from "@/features/onboarding/placement-flow";

export const metadata: Metadata = { title: "Find your level · Snakk" };

// Owner: T4. Outside the (app) shell on purpose: a focused, full-screen test.
export default function Page() {
  return <PlacementFlow />;
}
