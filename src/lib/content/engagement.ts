/**
 * T21 content: daily quests, seasonal challenges and sample teams.
 * Public data. The SERVER decides every reward (src/server/progress-rules.ts); the browser only shows progress.
 */
import type { Quest, Season, Team, VocabPack, VocabWord } from "./types";

// ---------- daily quests ----------

/** The pool. `stat` names a server counter that the rules engine bumps per day (daily counts `d:<stat>`). */
export const QUEST_POOL: Quest[] = [
  { id: "q-words", title: "Learn 3 new words", emoji: "🧠", stat: "words", target: 3, xp: 15, href: "/words" },
  { id: "q-scenario", title: "Finish a tutor scenario", emoji: "🎙️", stat: "scenarios", target: 1, xp: 20, href: "/speak" },
  { id: "q-phrases", title: "Learn 2 phrases", emoji: "💬", stat: "phrases", target: 2, xp: 10, href: "/phrases?show=new" },
  { id: "q-write", title: "Trace 3 letters or words", emoji: "✍️", stat: "writing", target: 3, xp: 10, href: "/write" },
  { id: "q-tandem", title: "Send 3 Tandem messages", emoji: "🤝", stat: "tandem", target: 3, xp: 10, href: "/tandem" },
  { id: "q-pron", title: "Do 2 pronunciation checks", emoji: "🎯", stat: "pronunciation", target: 2, xp: 15, href: "/speak" },
];

export const QUESTS_PER_DAY = 3;

/** Same 3 quests for everyone on a given Oslo day (deterministic, so server and browser agree). */
export function questsForDay(day: string): Quest[] {
  let h = 0;
  for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pool = [...QUEST_POOL];
  const picked: Quest[] = [];
  while (picked.length < QUESTS_PER_DAY && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    picked.push(pool.splice(h % pool.length, 1)[0]);
  }
  return picked;
}

// ---------- seasonal challenges ----------

const w = (id: string, no: string, en: string, exNo: string, exEn: string, level: VocabWord["level"] = "A2", register: VocabWord["register"] = "neutral"): VocabWord => ({
  id,
  no,
  en,
  level,
  register,
  example: { no: exNo, en: exEn },
});

export const seasonPacks: VocabPack[] = [
  {
    id: "season-autumn",
    kind: "season",
    title: "Cosy autumn",
    titleNo: "Koselig høst",
    emoji: "🍂",
    words: [
      w("autumn-host", "en høst", "autumn", "Høsten er min favoritt.", "Autumn is my favourite.", "A1"),
      w("autumn-regn", "regn", "rain", "Det er meldt regn hele uka.", "Rain is forecast all week."),
      w("autumn-paraply", "en paraply", "an umbrella", "Husk paraplyen!", "Remember your umbrella!"),
      w("autumn-morkt", "mørkt", "dark", "Det blir mørkt klokka fire nå.", "It gets dark at four o'clock now."),
      w("autumn-kakao", "en kakao", "a hot chocolate", "Skal vi ta en kakao?", "Shall we have a hot chocolate?", "A1"),
      w("autumn-ullgenser", "en ullgenser", "a wool jumper", "Ta på deg ullgenseren.", "Put on your wool jumper."),
      w("autumn-lys", "et lys", "a candle", "Vi tenner lys om kvelden.", "We light candles in the evening."),
    ],
  },
  {
    id: "season-christmas",
    kind: "season",
    title: "Christmas words",
    titleNo: "Juleord",
    emoji: "🎄",
    words: [
      w("christmas-jul", "jul", "Christmas", "God jul!", "Merry Christmas!", "A1"),
      w("christmas-julaften", "julaften", "Christmas Eve", "Vi feirer julaften hos mormor.", "We celebrate Christmas Eve at Grandma's."),
      w("christmas-gave", "en gave", "a present", "Takk for gaven!", "Thanks for the present!", "A1"),
      w("christmas-pepperkaker", "pepperkaker", "gingerbread biscuits", "Barna baker pepperkaker.", "The children are baking gingerbread biscuits."),
      w("christmas-nisse", "en nisse", "a Christmas elf / Santa", "Nissen kommer på julaften.", "Santa comes on Christmas Eve."),
      w("christmas-sno", "snø", "snow", "Blir det snø til jul?", "Will there be snow for Christmas?", "A1"),
    ],
  },
  {
    id: "season-17mai",
    kind: "season",
    title: "17 May, Constitution Day",
    titleNo: "Syttende mai",
    emoji: "🇳🇴",
    words: [
      w("17mai-nasjonaldag", "nasjonaldagen", "the national day", "Gratulerer med nasjonaldagen!", "Happy national day!", "A2"),
      w("17mai-flagg", "et flagg", "a flag", "Alle har flagg i hånda.", "Everyone has a flag in their hand.", "A1"),
      w("17mai-bunad", "en bunad", "a national costume", "Hun har på seg bunad.", "She's wearing a bunad."),
      w("17mai-barnetog", "et barnetog", "a children's parade", "Barnetoget går forbi slottet.", "The children's parade goes past the palace.", "B1"),
      w("17mai-is", "en is", "an ice cream", "Barna får is og pølser.", "The children get ice cream and hot dogs.", "A1"),
      w("17mai-hurra", "hipp hipp hurra", "hip hip hooray", "Hipp hipp hurra for Norge!", "Hip hip hooray for Norway!", "A1", "informal"),
    ],
  },
];

export const seasons: Season[] = [
  { id: "autumn-2026", title: "Cosy autumn week", emoji: "🍂", start: "2026-11-02", end: "2026-11-15", goal: 5, packId: "season-autumn", achievementId: "season-autumn-2026" },
  { id: "christmas-2026", title: "Christmas words", emoji: "🎄", start: "2026-12-01", end: "2026-12-26", goal: 5, packId: "season-christmas", achievementId: "season-christmas-2026" },
  { id: "17mai-2027", title: "17 May challenge", emoji: "🇳🇴", start: "2027-05-10", end: "2027-05-17", goal: 5, packId: "season-17mai", achievementId: "season-17mai-2027" },
];

/** The season running on an Oslo date (YYYY-MM-DD), if any. */
export function activeSeason(day: string): Season | undefined {
  return seasons.find((s) => day >= s.start && day <= s.end);
}

// ---------- team league ----------

/** SAMPLE teams for the demo. A real version needs accounts (roadmap, T17). */
export const sampleTeams: Team[] = [
  { code: "LAGER-OSLO", name: "Lager Oslo Øst", emoji: "📦", kind: "Workplace", members: 14, weekXp: 2140, isSample: true },
  { code: "INTRO-GRUNER", name: "Introduksjonsprogrammet Grünerløkka", emoji: "🧭", kind: "Introduction programme", members: 22, weekXp: 3310, isSample: true },
  { code: "OMSORG-BERGEN", name: "Omsorgssenteret Bergen", emoji: "🩺", kind: "Workplace", members: 9, weekXp: 1560, isSample: true },
  { code: "SKOLE-TOYEN", name: "Tøyen skole, 9B", emoji: "🎒", kind: "School", members: 26, weekXp: 2890, isSample: true },
  { code: "BIBLIOTEK-DEICH", name: "Språkkafé-gjengen", emoji: "📚", kind: "Library", members: 17, weekXp: 1980, isSample: true },
];

export function getTeam(code: string): Team | undefined {
  return sampleTeams.find((t) => t.code === code.trim().toUpperCase());
}
