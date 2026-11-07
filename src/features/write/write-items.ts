/**
 * What learners trace in /write (T12): the whole Norwegian alphabet (A–Å, capitals and small letters),
 * then short everyday words. Public content. `id` is what we send as `writing_done.itemId`.
 */
import { LETTER_STROKES } from "./letter-strokes";

export type WriteGroup = "upper" | "lower" | "word";

export interface WriteItem {
  id: string;
  /** What to trace. */
  text: string;
  kind: "letter" | "word";
  group: WriteGroup;
  /** English meaning or what the letter is. */
  meaning: string;
  /** How it sounds, in plain English. */
  sound: string;
  /** Stroke-by-stroke guide (letters only): SVG paths in a 100×100 box, see letter-strokes.ts. */
  strokes?: string[];
  /** Optional phrasebook card to open afterwards. */
  phraseId?: string;
  /** T20: not shown to the 13–17 age group (e.g. alcohol). */
  adultOnly?: boolean;
}

/** The 29 letters, with how Norwegians say the letter's name, in plain English letters. */
const ALPHABET: { letter: string; name: string; tip?: string }[] = [
  { letter: "a", name: "«ah»" },
  { letter: "b", name: "«beh»" },
  { letter: "c", name: "«seh»", tip: "Mostly in foreign words." },
  { letter: "d", name: "«deh»" },
  { letter: "e", name: "«eh»" },
  { letter: "f", name: "«eff»" },
  { letter: "g", name: "«geh»" },
  { letter: "h", name: "«haw»" },
  { letter: "i", name: "«ee»" },
  { letter: "j", name: "«yeh»", tip: "Sounds like English «y»: «ja» = «yah»." },
  { letter: "k", name: "«kaw»" },
  { letter: "l", name: "«ell»" },
  { letter: "m", name: "«emm»" },
  { letter: "n", name: "«enn»" },
  { letter: "o", name: "«oo»", tip: "Often like «oo» in «moon»." },
  { letter: "p", name: "«peh»" },
  { letter: "q", name: "«koo»", tip: "Rare: mostly in names." },
  { letter: "r", name: "«ærr»", tip: "A short, tapped r." },
  { letter: "s", name: "«ess»" },
  { letter: "t", name: "«teh»" },
  { letter: "u", name: "«oo» with pursed lips" },
  { letter: "v", name: "«veh»" },
  { letter: "w", name: "«DOB-belt-veh»", tip: "Rare: sounds like «v»." },
  { letter: "x", name: "«eks»" },
  { letter: "y", name: "«ee» with rounded lips", tip: "Like German «ü»." },
  { letter: "z", name: "«sett»", tip: "Rare: sounds like «s»." },
  { letter: "æ", name: "Like the «a» in «cat», a bit longer." },
  { letter: "ø", name: "Say «e», then round your lips like for «o»." },
  { letter: "å", name: "Like the «o» in «more»." },
];

// Keep the ids the first version used for æ, ø, å, so earlier ✓ marks stay.
const LEGACY_IDS: Record<string, string> = { æ: "ae", ø: "oe", å: "aa" };
const letterId = (l: string) => LEGACY_IDS[l] ?? l;

const LETTERS: WriteItem[] = ALPHABET.flatMap(({ letter, name, tip }) => {
  const upper = letter.toUpperCase();
  const sound = tip ? `${name} ${tip}` : name;
  return [
    { id: `${letterId(letter)}-upper`, text: upper, kind: "letter", group: "upper", meaning: `Capital ${upper}`, sound, strokes: LETTER_STROKES[upper] },
    { id: letterId(letter), text: letter, kind: "letter", group: "lower", meaning: `Small ${letter}`, sound, strokes: LETTER_STROKES[letter] },
  ] satisfies WriteItem[];
});

const WORDS: WriteItem[] = [
  { id: "w-hei", text: "hei", kind: "word", group: "word", meaning: "hi", sound: "Like «hay»." },
  { id: "w-takk", text: "takk", kind: "word", group: "word", meaning: "thanks", sound: "Short «a», hard «kk»." },
  { id: "w-blaa", text: "blå", kind: "word", group: "word", meaning: "blue", sound: "«blaw», with the å sound." },
  { id: "w-oel", text: "øl", kind: "word", group: "word", meaning: "beer", sound: "The ø sound, then «l».", adultOnly: true },
  { id: "w-kos", text: "kos", kind: "word", group: "word", meaning: "cosiness", sound: "«koos», long o.", phraseId: "kos" },
  { id: "w-digg", text: "digg", kind: "word", group: "word", meaning: "nice / tasty", sound: "Short «i», hard «gg».", phraseId: "digg" },
  { id: "w-vaer", text: "vær", kind: "word", group: "word", meaning: "weather", sound: "«vær» with the æ sound." },
  { id: "w-snakkes", text: "snakkes", kind: "word", group: "word", meaning: "talk soon", sound: "«SNAK-kes».", phraseId: "snakkes" },
];

export const WRITE_ITEMS: WriteItem[] = [
  ...LETTERS.filter((l) => l.group === "upper"),
  ...LETTERS.filter((l) => l.group === "lower"),
  ...WORDS,
];

export const WRITE_GROUPS: { id: WriteGroup; label: string; hint: string }[] = [
  { id: "upper", label: "ABC", hint: "Capital letters" },
  { id: "lower", label: "abc", hint: "Small letters" },
  { id: "word", label: "Words", hint: "Short words" },
];
