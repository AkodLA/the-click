/**
 * What learners trace in /write (T12): first the three extra letters, then short everyday words.
 * Public content. `id` is what we send as `writing_done.itemId`.
 */
export interface WriteItem {
  id: string;
  /** What to trace. */
  text: string;
  kind: "letter" | "word";
  /** English meaning or what the letter is. */
  meaning: string;
  /** How it sounds, in plain English. */
  sound: string;
  /** Optional phrasebook card to open afterwards. */
  phraseId?: string;
  /** T20: not shown to the 13–17 age group (e.g. alcohol). */
  adultOnly?: boolean;
}

export const WRITE_ITEMS: WriteItem[] = [
  { id: "ae", text: "æ", kind: "letter", meaning: "Letter æ", sound: "Like the «a» in «cat», a bit longer." },
  { id: "oe", text: "ø", kind: "letter", meaning: "Letter ø", sound: "Say «e», then round your lips like for «o»." },
  { id: "aa", text: "å", kind: "letter", meaning: "Letter å", sound: "Like the «o» in «more»." },
  { id: "ae-upper", text: "Æ", kind: "letter", meaning: "Capital Æ", sound: "Same sound as æ." },
  { id: "oe-upper", text: "Ø", kind: "letter", meaning: "Capital Ø", sound: "Same sound as ø." },
  { id: "aa-upper", text: "Å", kind: "letter", meaning: "Capital Å", sound: "Same sound as å." },
  { id: "w-hei", text: "hei", kind: "word", meaning: "hi", sound: "Like «hay»." },
  { id: "w-takk", text: "takk", kind: "word", meaning: "thanks", sound: "Short «a», hard «kk»." },
  { id: "w-blaa", text: "blå", kind: "word", meaning: "blue", sound: "«blaw», with the å sound." },
  { id: "w-oel", text: "øl", kind: "word", meaning: "beer", sound: "The ø sound, then «l».", adultOnly: true },
  { id: "w-kos", text: "kos", kind: "word", meaning: "cosiness", sound: "«koos», long o.", phraseId: "kos" },
  { id: "w-digg", text: "digg", kind: "word", meaning: "nice / tasty", sound: "Short «i», hard «gg».", phraseId: "digg" },
  { id: "w-vaer", text: "vær", kind: "word", meaning: "weather", sound: "«vær» with the æ sound." },
  { id: "w-snakkes", text: "snakkes", kind: "word", meaning: "talk soon", sound: "«SNAK-kes».", phraseId: "snakkes" },
];
