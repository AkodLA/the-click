/**
 * Achievements, league, events, tandem partners.
 * ALL OF THIS IS TEST DATA for the demo (nicknames and events are made up).
 * Owners: T6 achievements, T9 league, T10 tandem, T11 events.
 */
import type { Achievement, LanguageEvent, LeagueEntry, TandemMessage, TandemPartner } from "./types";

export const achievements: Achievement[] = [
  { id: "placement-done", title: "Level found", description: "Finish the placement test.", emoji: "🧭", xp: 20 },
  { id: "first-talk", title: "First words", description: "Finish your first conversation with the tutor.", emoji: "🗣️", xp: 30 },
  { id: "slang-5", title: "Street smart", description: "Learn 5 slang or informal phrases.", emoji: "😎", xp: 40 },
  { id: "register-pro", title: "Right word, right room", description: "Finish a formal scenario without any slang.", emoji: "🎩", xp: 60 },
  { id: "perfect-pron", title: "Native ears", description: "Score 90+ on a pronunciation check.", emoji: "🎯", xp: 50 },
  { id: "streak-3", title: "On a roll", description: "Practise 3 days in a row.", emoji: "🔥", xp: 30 },
  { id: "streak-7", title: "Week warrior", description: "Practise 7 days in a row.", emoji: "⚡", xp: 70 },
  { id: "tandem-first", title: "New buddy", description: "Send your first tandem message.", emoji: "🤝", xp: 30 },
  { id: "sprakkafe", title: "Café regular", description: "Check in at a språkkafé.", emoji: "🧇", xp: 80 },
  { id: "league-top3", title: "Podium", description: "Finish a week in the top 3 of your league.", emoji: "🏆", xp: 100 },
];

/** Weekly league, grouped by level so beginners compete with beginners. */
export const leagueWeek: LeagueEntry[] = [
  { nickname: "FjordFox", avatar: "🦊", level: "A2", xp: 640 },
  { nickname: "BrunostBoss", avatar: "🧀", level: "A2", xp: 585 },
  { nickname: "NordlysNina", avatar: "🌌", level: "A2", xp: 512 },
  { nickname: "TacoTiger", avatar: "🐯", level: "A2", xp: 430 },
  { nickname: "MoltebærMax", avatar: "🫐", level: "A2", xp: 377 },
  { nickname: "VikingVibes", avatar: "⛵", level: "A2", xp: 290 },
  { nickname: "SkiSkiSara", avatar: "🎿", level: "B1", xp: 820 },
  { nickname: "TrollTalk", avatar: "🧌", level: "B1", xp: 610 },
  { nickname: "KanelKarl", avatar: "🥐", level: "B1", xp: 455 },
  // More test players (T9), so every level has a league and a new learner can climb past someone.
  { nickname: "PolarPia", avatar: "🐻‍❄️", level: "A2", xp: 140 },
  { nickname: "KaffeKoffi", avatar: "☕", level: "A2", xp: 65 },
  { nickname: "LuffeLiv", avatar: "🧇", level: "B1", xp: 210 },
  { nickname: "FyrtårnFred", avatar: "🗼", level: "B1", xp: 90 },
  { nickname: "HeiHamid", avatar: "👋", level: "A0", xp: 120 },
  { nickname: "SnøSofia", avatar: "❄️", level: "A0", xp: 70 },
  { nickname: "BåtBo", avatar: "🚤", level: "A0", xp: 25 },
  { nickname: "TrikkTina", avatar: "🚋", level: "A1", xp: 310 },
  { nickname: "ElgElias", avatar: "🫎", level: "A1", xp: 220 },
  { nickname: "BolleBea", avatar: "🧁", level: "A1", xp: 150 },
  { nickname: "PinnePeder", avatar: "🌲", level: "A1", xp: 80 },
  { nickname: "RegnRami", avatar: "🌧️", level: "A1", xp: 35 },
  { nickname: "FjelletFarah", avatar: "🏔️", level: "B2", xp: 930 },
  { nickname: "GeitGeir", avatar: "🐐", level: "B2", xp: 540 },
  { nickname: "SildSiri", avatar: "🐟", level: "B2", xp: 260 },
  { nickname: "OperaOla", avatar: "🎭", level: "C1", xp: 700 },
  { nickname: "BokBashir", avatar: "📚", level: "C1", xp: 380 },
  { nickname: "MidnattMia", avatar: "🌞", level: "C2", xp: 450 },
];

export const leagueMonth: LeagueEntry[] = leagueWeek.map((e) => ({ ...e, xp: e.xp * 4 - 120 }));

/** Example språkkafé events. In production a daily agent finds real ones (roadmap). */
export const languageEvents: LanguageEvent[] = [
  {
    id: "ev-1",
    title: "Språkkafé: Norwegian for everyone",
    place: "Public library (example)",
    area: "Grünerløkka",
    startsAt: "2026-11-09T17:00:00+01:00",
    levels: ["A1", "A2", "B1"],
    xpReward: 80,
    description: "Practise Norwegian over coffee with volunteers. Drop in, no sign-up.",
    isSample: true,
  },
  {
    id: "ev-2",
    title: "Walk & talk by the river",
    place: "Akerselva (example)",
    area: "Vulkan",
    startsAt: "2026-11-11T18:00:00+01:00",
    levels: ["A2", "B1", "B2"],
    xpReward: 60,
    description: "A slow walk with conversation topics on cards.",
    isSample: true,
  },
  {
    id: "ev-3",
    title: "Board games på norsk",
    place: "Café (example)",
    area: "Tøyen",
    startsAt: "2026-11-14T15:00:00+01:00",
    levels: ["B1", "B2", "C1"],
    xpReward: 70,
    description: "Learn the words you actually need to win.",
    isSample: true,
  },
];

/** Anonymous tandem partners: nickname + avatar only. */
export const tandemPartners: TandemPartner[] = [
  { id: "tp-1", nickname: "SolSeeker", avatar: "🌞", offers: "es", wants: "nb", level: "A2", online: true, interests: ["football", "cooking"] },
  { id: "tp-2", nickname: "Nordkapp", avatar: "🧭", offers: "nb", wants: "es", level: "B1", online: true, interests: ["hiking", "music"] },
  { id: "tp-3", nickname: "KaffeKatt", avatar: "🐈", offers: "nb", wants: "en", level: "B2", online: false, interests: ["films", "coffee"] },
  { id: "tp-4", nickname: "Lumi", avatar: "❄️", offers: "en", wants: "nb", level: "A1", online: true, interests: ["gaming", "travel"] },
  // More test partners (T10), so every app language has a Norwegian match.
  { id: "tp-5", nickname: "Kvikklunsj", avatar: "🍫", offers: "nb", wants: "en", level: "C1", online: true, interests: ["skiing", "podcasts"] },
  { id: "tp-6", nickname: "Bølgen", avatar: "🌊", offers: "nb", wants: "ar", level: "C2", online: true, interests: ["surfing", "food"] },
  { id: "tp-7", nickname: "Granskog", avatar: "🌲", offers: "nb", wants: "uk", level: "C2", online: true, interests: ["chess", "hiking"] },
  { id: "tp-8", nickname: "Pepperkake", avatar: "🍪", offers: "nb", wants: "pl", level: "C2", online: false, interests: ["baking", "football"] },
  { id: "tp-9", nickname: "Tindetur", avatar: "⛰️", offers: "nb", wants: "so", level: "C2", online: true, interests: ["running", "music"] },
  { id: "tp-10", nickname: "Lysløype", avatar: "🔦", offers: "nb", wants: "fr", level: "C2", online: true, interests: ["books", "cycling"] },
  { id: "tp-11", nickname: "Fjellrev", avatar: "🦊", offers: "nb", wants: "es", level: "C2", online: false, interests: ["photography", "dogs"] },
];

export const tandemDemoChat: TandemMessage[] = [
  { id: "m1", from: "partner", text: "Hei! Jeg heter Nordkapp 😄 Hvor kommer du fra?", ts: "2026-11-07T12:00:00+01:00" },
  { id: "m2", from: "me", text: "Hei! Jeg kommer fra Spania. Jeg er bor i Oslo nå.", correction: "Jeg bor i Oslo nå. (no «er» before «bor»)", ts: "2026-11-07T12:01:00+01:00" },
  { id: "m3", from: "partner", text: "Digg! Kan du lære meg noen spanske ord? 🙏", ts: "2026-11-07T12:02:00+01:00" },
];
