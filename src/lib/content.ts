// All learning content for the demo. Plain data, no code, so the team can edit it fast.

// ---------------------------------------------------------------------------
// Levels (CEFR, plus A0 for total beginners)
// ---------------------------------------------------------------------------
export const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_TEXT: Record<Level, string> = {
  A0: "Helt ny. Vi starter med lyder og hilsener.",
  A1: "Du klarer enkle hilsener og ord.",
  A2: "Du klarer korte hverdagssamtaler.",
  B1: "Du klarer deg på jobb og i butikken.",
  B2: "Du følger med i raske samtaler.",
  C1: "Du tar humor, ironi og slang.",
  C2: "Du høres ut som du er født her.",
};

// ---------------------------------------------------------------------------
// Register: the colour system of the whole app
// ---------------------------------------------------------------------------
export type Register = "kompis" | "hverdag" | "formell" | "unnga";

export const REGISTER: Record<Register, { label: string; who: string; chip: string; dot: string }> = {
  kompis: { label: "Kompis", who: "venner, søsken, fotballaget", chip: "bg-sol-soft text-ink", dot: "bg-sol" },
  hverdag: { label: "Hverdag", who: "kolleger, naboer, butikken", chip: "bg-gran-soft text-gran-deep", dot: "bg-gran" },
  formell: { label: "Formell", who: "NAV, skolen, legen, jobbintervju", chip: "bg-fjord-soft text-fjord", dot: "bg-fjord" },
  unnga: { label: "Unngå", who: "nesten alltid", chip: "bg-tytte-soft text-tytte", dot: "bg-tytte" },
};

export type Situation = "venner" | "kollega" | "sjef" | "skole" | "eldre";
export const SITUATIONS: { id: Situation; label: string; icon: string }[] = [
  { id: "venner", label: "Venner", icon: "🛹" },
  { id: "kollega", label: "Kollega", icon: "☕" },
  { id: "sjef", label: "Sjefen", icon: "💼" },
  { id: "skole", label: "Skole / NAV", icon: "🏫" },
  { id: "eldre", label: "Eldre", icon: "👵" },
];

// ---------------------------------------------------------------------------
// Slang & real-life phrases: when to use, when not, what to say instead
// ---------------------------------------------------------------------------
export interface Phrase {
  id: string;
  say: string;
  means: string; // plain English meaning
  register: Register;
  ok: Situation[];
  no: Situation[];
  instead: string; // what to say in the "no" situations
  example: string;
  note?: string;
  level: Level;
}

export const PHRASES: Phrase[] = [
  {
    id: "skjera",
    say: "Skjer'a?",
    means: "What's up?",
    register: "kompis",
    ok: ["venner"],
    no: ["sjef", "skole", "eldre"],
    instead: "Hei, hvordan går det?",
    example: "– Skjer'a? – Ikke no' spes, du?",
    level: "A2",
  },
  {
    id: "takk-for-sist",
    say: "Takk for sist!",
    means: "Thanks for last time (said when you meet someone again)",
    register: "hverdag",
    ok: ["venner", "kollega", "sjef", "eldre"],
    no: [],
    instead: "Passer nesten overalt.",
    example: "Hei Kari, takk for sist! Det var en fin middag.",
    note: "Ingen lærebok sier det, men alle nordmenn gjør det. Glemmer du det, merker folk det.",
    level: "A2",
  },
  {
    id: "du-de",
    say: "Du (ikke De)",
    means: "You. Norwegians say «du» even to the boss and the doctor.",
    register: "hverdag",
    ok: ["venner", "kollega", "sjef", "skole"],
    no: [],
    instead: "«De» høres gammeldags ut. Bruk det bare med svært gamle mennesker, om i det hele tatt.",
    example: "Kan du hjelpe meg med søknaden?",
    note: "Det formelle i norsk ligger i ordene du velger, ikke i «du» og «De».",
    level: "A1",
  },
  {
    id: "digg",
    say: "Digg",
    means: "Nice / tasty / great",
    register: "kompis",
    ok: ["venner", "kollega"],
    no: ["skole", "eldre"],
    instead: "Det var veldig godt / veldig fint.",
    example: "Digg med fredag, ass.",
    level: "A2",
  },
  {
    id: "sykt",
    say: "Sykt bra",
    means: "Really good (literally «sick good»)",
    register: "kompis",
    ok: ["venner"],
    no: ["sjef", "skole", "eldre"],
    instead: "Veldig bra.",
    example: "Konserten var sykt bra!",
    note: "Med eldre kan «sykt» bli tatt bokstavelig: de tror noen er syke.",
    level: "B1",
  },
  {
    id: "ass",
    say: "…ass",
    means: "Filler word, like «you know» (short for «altså»)",
    register: "kompis",
    ok: ["venner"],
    no: ["sjef", "skole"],
    instead: "Bare dropp det.",
    example: "Jeg er så trøtt, ass.",
    level: "B1",
  },
  {
    id: "wolla",
    say: "Wolla",
    means: "I swear (Oslo street slang, from Arabic «wallah»)",
    register: "kompis",
    ok: ["venner"],
    no: ["kollega", "sjef", "skole", "eldre"],
    instead: "Jeg lover. / Seriøst.",
    example: "Wolla, jeg var der klokka åtte.",
    note: "Vanlig blant unge på østkanten. På jobbintervju kan det koste deg jobben.",
    level: "B1",
  },
  {
    id: "kjipt",
    say: "Kjipt",
    means: "That sucks / too bad",
    register: "hverdag",
    ok: ["venner", "kollega"],
    no: ["skole"],
    instead: "Det var synd.",
    example: "Er bussen innstilt? Så kjipt.",
    level: "A2",
  },
  {
    id: "gidder",
    say: "Gidder ikke",
    means: "Can't be bothered",
    register: "kompis",
    ok: ["venner"],
    no: ["kollega", "sjef", "skole"],
    instead: "Jeg rekker ikke det i dag. / Jeg har ikke mulighet.",
    example: "Gidder ikke å gå ut i dette været.",
    note: "Til sjefen høres det ut som du ikke bryr deg.",
    level: "B1",
  },
  {
    id: "drittlei",
    say: "Drittlei",
    means: "Fed up (with a mild swear in front)",
    register: "kompis",
    ok: ["venner"],
    no: ["sjef", "skole", "eldre"],
    instead: "Jeg er veldig lei av det.",
    example: "Jeg er drittlei av regn.",
    level: "B1",
  },
  {
    id: "faen",
    say: "Faen",
    means: "Damn (a real swear word)",
    register: "unnga",
    ok: [],
    no: ["kollega", "sjef", "skole", "eldre"],
    instead: "Søren! / Huff!",
    example: "Søren, jeg glemte nøkkelen.",
    note: "Nordmenn banner mye, men lærer du det først, høres du feil ut i nesten alle situasjoner.",
    level: "B2",
  },
  {
    id: "snakkes",
    say: "Snakkes!",
    means: "Talk later / bye",
    register: "hverdag",
    ok: ["venner", "kollega", "sjef"],
    no: ["skole"],
    instead: "Ha en fin dag.",
    example: "Ok, snakkes i morgen!",
    level: "A1",
  },
  {
    id: "jeg-lurer",
    say: "Jeg lurer på om …",
    means: "I was wondering if … (the polite way to ask)",
    register: "formell",
    ok: ["kollega", "sjef", "skole", "eldre"],
    no: [],
    instead: "Det høflige standardvalget. Bruk det når du er usikker.",
    example: "Jeg lurer på om jeg kan få et møte neste uke?",
    level: "A2",
  },
];

// ---------------------------------------------------------------------------
// Placement test (A0–C2). Listening items use the browser's Norwegian voice.
// ---------------------------------------------------------------------------
export interface TestItem {
  kind: "listen" | "read" | "register";
  level: Level;
  prompt: string;
  audio?: string; // spoken with nb-NO text-to-speech
  options: string[];
  answer: number;
}

export const PLACEMENT: TestItem[] = [
  { kind: "listen", level: "A1", prompt: "Hva hører du?", audio: "Hei! Hva heter du?", options: ["Hvor bor du?", "Hva heter du?", "Hvem er du?"], answer: 1 },
  { kind: "read", level: "A1", prompt: "«Jeg er sulten.» Hva betyr det?", options: ["I'm tired", "I'm hungry", "I'm cold"], answer: 1 },
  { kind: "listen", level: "A2", prompt: "Når går bussen?", audio: "Bussen går kvart over åtte.", options: ["08:15", "07:45", "08:30"], answer: 0 },
  { kind: "read", level: "A2", prompt: "Du møter naboen du spiste middag med i helgen. Hva sier du først?", options: ["God morgen, De.", "Takk for sist!", "Skål!"], answer: 1 },
  { kind: "register", level: "B1", prompt: "Du skriver e-post til læreren til barnet ditt. Hva passer?", options: ["Skjer'a? Kan vi ta en prat?", "Jeg lurer på om vi kan ta en prat neste uke?", "Gidder du å ringe meg?"], answer: 1 },
  { kind: "listen", level: "B1", prompt: "Hva mener kollegaen?", audio: "Det er bare å si fra hvis du trenger noe, altså.", options: ["Du må spørre sjefen.", "Si ifra hvis du trenger hjelp.", "Du har gjort noe feil."], answer: 1 },
  { kind: "register", level: "B2", prompt: "Hvilken setning er for uformell på et jobbintervju?", options: ["Jeg trives godt i team.", "Det var sykt kult å jobbe der, ass.", "Jeg har erfaring med kundeservice."], answer: 1 },
  { kind: "listen", level: "B2", prompt: "Hva betyr svaret?", audio: "Nei, det er nok ikke helt min kopp te.", options: ["Hun liker ikke te.", "Det er ikke noe for henne.", "Hun er tørst."], answer: 1 },
  { kind: "read", level: "C1", prompt: "«Han tok det med en klype salt.» Hva gjorde han?", options: ["Han var skeptisk.", "Han lagde mat.", "Han ble sint."], answer: 0 },
  { kind: "register", level: "C2", prompt: "Kollegaen sier: «Fint vær i dag, da», mens det øsregner. Hva er det?", options: ["En værmelding", "Ironi", "En klage til sjefen"], answer: 1 },
];

export function levelFromScore(correct: boolean[]): Level {
  // Highest level where the learner got every item at that level and below "mostly" right.
  let level: Level = "A0";
  for (const lv of LEVELS.slice(1)) {
    const items = PLACEMENT.map((it, i) => ({ it, ok: correct[i] })).filter((x) => x.it.level === lv);
    if (items.length === 0) continue;
    const hit = items.filter((x) => x.ok).length / items.length;
    if (hit >= 0.5) level = lv;
    else break;
  }
  return level;
}

// ---------------------------------------------------------------------------
// Speaking scenarios for the voice tutor
// ---------------------------------------------------------------------------
export interface Scenario {
  id: string;
  title: string;
  icon: string;
  level: Level;
  register: Register;
  role: string; // who the agent plays
  goal: string; // what the learner should manage to do
  targets: string[]; // phrases the tutor listens for
}

export const SCENARIOS: Scenario[] = [
  {
    id: "lunsj",
    title: "Lunsjpausen på jobb",
    icon: "🥪",
    level: "A2",
    register: "hverdag",
    role: "Kari, en hyggelig kollega i lunsjrommet",
    goal: "Småprat om helgen og været",
    targets: ["Takk for sist", "Hva gjorde du i helgen?", "Så kjipt"],
  },
  {
    id: "lege",
    title: "Ringe legekontoret",
    icon: "🩺",
    level: "A2",
    register: "formell",
    role: "Resepsjonisten på legekontoret",
    goal: "Bestill en time og si hva det gjelder",
    targets: ["Jeg lurer på om", "Jeg vil gjerne bestille en time", "Passer det på torsdag?"],
  },
  {
    id: "utviklingssamtale",
    title: "Utviklingssamtale",
    icon: "🏫",
    level: "B1",
    register: "formell",
    role: "Kontaktlæreren til barnet ditt",
    goal: "Spør hvordan barnet har det, og hva dere kan øve på hjemme",
    targets: ["Hvordan trives hun?", "Hva kan vi øve på hjemme?", "Jeg lurer på om"],
  },
  {
    id: "nabo",
    title: "Naboen i trappa",
    icon: "🏠",
    level: "A1",
    register: "hverdag",
    role: "Per, en eldre nabo",
    goal: "Hils, presenter deg og si hvor du bor",
    targets: ["Hei, jeg heter", "Jeg bor i tredje etasje", "Hyggelig å hilse på deg"],
  },
  {
    id: "fredag",
    title: "Fredag med vennene",
    icon: "🍕",
    level: "B1",
    register: "kompis",
    role: "Jonas, en kompis fra fotballen",
    goal: "Lag planer for kvelden med ekte slang",
    targets: ["Skjer'a?", "Digg", "Snakkes"],
  },
  {
    id: "intervju",
    title: "Jobbintervju",
    icon: "💼",
    level: "B2",
    register: "formell",
    role: "Leder i en butikkjede",
    goal: "Fortell om deg selv uten slang",
    targets: ["Jeg har erfaring med", "Jeg trives godt i team", "Jeg lurer på om"],
  },
];

// ---------------------------------------------------------------------------
// Language-learning meetups (sample data – the daily agent refreshes this in production)
// ---------------------------------------------------------------------------
export interface Meetup {
  id: string;
  name: string;
  host: string;
  where: string;
  when: string;
  levels: string;
  xp: number;
}

export const MEETUPS: Meetup[] = [
  { id: "deichman-grunerlokka", name: "Språkkafé", host: "Deichman Grünerløkka", where: "Schous plass 10", when: "Tirsdag 17:00", levels: "A1–B2", xp: 150 },
  { id: "deichman-bjorvika", name: "Språkkafé", host: "Deichman Bjørvika", where: "Anne-Cath. Vestlys plass 1", when: "Torsdag 16:30", levels: "Alle", xp: 150 },
  { id: "rodekors-norsk", name: "Norsktrening", host: "Røde Kors", where: "Hausmanns gate 7", when: "Onsdag 18:00", levels: "A0–B1", xp: 150 },
  { id: "turgruppe", name: "Prat på tur", host: "Prat-fellesskapet", where: "Sognsvann parkering", when: "Søndag 12:00", levels: "B1+", xp: 200 },
];

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export interface Achievement {
  id: string;
  title: string;
  how: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "forste-ord", title: "Første ord", how: "Fullfør nivåtesten", icon: "🌱" },
  { id: "forste-prat", title: "Første prat", how: "Snakk med læreren for første gang", icon: "🎙" },
  { id: "registersans", title: "Registersans", how: "Lær 5 uttrykk og når de passer", icon: "🎚" },
  { id: "tolket", title: "Ingen barn som tolk", how: "Bruk tolken i en ekte samtale", icon: "🤝" },
  { id: "egen-stemme", title: "Egen stemme", how: "Øv på en frase fra en tolket samtale", icon: "🗣" },
  { id: "aeoa", title: "Æ, ø og å", how: "Skriv alle tre bokstavene", icon: "✍️" },
  { id: "kafe", title: "Kaffe og kasus", how: "Sjekk inn på en språkkafé", icon: "☕" },
  { id: "tandem", title: "Bytte språk", how: "Start en tandem-prat", icon: "🔁" },
  { id: "streak-7", title: "En hel uke", how: "Øv 7 dager på rad", icon: "🔥" },
];

// ---------------------------------------------------------------------------
// Tandem partners (anonymous nicknames + avatars only)
// ---------------------------------------------------------------------------
export interface TandemPartner {
  nick: string;
  avatar: string;
  hue: string; // avatar background
  speaks: string;
  learns: string;
  level: Level;
  topic: string;
}

export const TANDEM: TandemPartner[] = [
  { nick: "Fjellrev", avatar: "🦊", hue: "bg-sol-soft", speaks: "Norsk", learns: "Spansk", level: "A2", topic: "Fotball og mat" },
  { nick: "Måke", avatar: "🐦", hue: "bg-fjord-soft", speaks: "Norsk", learns: "Arabisk", level: "A1", topic: "Reise" },
  { nick: "Elg", avatar: "🫎", hue: "bg-gran-soft", speaks: "Norsk", learns: "Somali", level: "A0", topic: "Musikk" },
  { nick: "Lunde", avatar: "🐧", hue: "bg-tytte-soft", speaks: "Norsk", learns: "Polsk", level: "B1", topic: "Jobb og karriere" },
];

export const LEARNER_LANGUAGES = [
  { code: "so", native: "Soomaali", flag: "🇸🇴" },
  { code: "ar", native: "العربية", flag: "🇸🇦" },
  { code: "uk", native: "Українська", flag: "🇺🇦" },
  { code: "pl", native: "Polski", flag: "🇵🇱" },
  { code: "ti", native: "ትግርኛ", flag: "🇪🇷" },
  { code: "es", native: "Español", flag: "🇪🇸" },
  { code: "en", native: "English", flag: "🇬🇧" },
];

// ---------------------------------------------------------------------------
// Weekly league (one league per level band)
// ---------------------------------------------------------------------------
export const LEAGUE = [
  { nick: "Fjellrev", avatar: "🦊", xp: 1840 },
  { nick: "Trikk", avatar: "🚋", xp: 1655 },
  { nick: "Brunost", avatar: "🧀", xp: 1420 },
  { nick: "Nordlys", avatar: "🌌", xp: 1170 },
  { nick: "Lunde", avatar: "🐧", xp: 960 },
  { nick: "Kvikk", avatar: "🍫", xp: 610 },
];
