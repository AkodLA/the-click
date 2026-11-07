import type { Metadata } from "next";
import { ProfileView } from "@/features/profile/profile-view";

export const metadata: Metadata = { title: "Profile · Snakk" };

// Owner: T6. The real UI lives in src/features/profile/.
export default function Page() {
  return <ProfileView />;
}
