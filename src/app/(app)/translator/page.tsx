import type { Metadata } from "next";
import { TranslatorCheck } from "@/features/translate/translator-check";

export const metadata: Metadata = { title: "Translator · Snakk" };

// Owner: T22. On-device translator status, self-test and free translation (src/features/translate/).
export default function Page() {
  return <TranslatorCheck />;
}
