import type { Metadata } from "next";
import { NotesView } from "@/features/notes/notes-view";

export const metadata: Metadata = { title: "My notes · Snakk" };

// Notes: the learner's notebooks. The real UI lives in src/features/notes/.
export default function Page() {
  return <NotesView />;
}
