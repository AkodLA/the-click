import { ComingSoon } from "@/components/ui";
import { PronunciationPractice } from "@/features/pronunciation/pronunciation-practice";

// Owner: T2. Build the feature in src/features/ and render it here.
// T5: keep <PronunciationPractice /> on this page when you replace the placeholder.
export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <ComingSoon task="T2" title="Speak with your tutor" emoji="🎙️">
        Pick a real-life scenario and talk out loud. The tutor answers, keeps the conversation going and corrects slang used in the wrong place.
      </ComingSoon>
      <PronunciationPractice />
    </div>
  );
}
