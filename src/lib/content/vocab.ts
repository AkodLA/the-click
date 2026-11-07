/**
 * Personal vocabulary packs (T20): words for your field of work/study and your interests.
 * Rule (same as phrases): real spoken Norwegian, every card checked by a native speaker before the demo.
 * Keep ids stable: they are sent as `word_learned.wordId` and stored in progress.
 */
import { seasonPacks } from "./engagement";
import { everydayPacks } from "./everyday";
import { WORD_PICTURES } from "./pictures";
import type { AgeGroup, FieldId, InterestId, VocabPack, VocabWord } from "./types";

const w = (id: string, no: string, en: string, level: VocabWord["level"], exNo: string, exEn: string, register: VocabWord["register"] = "neutral"): VocabWord => ({
  id,
  no,
  en,
  level,
  register,
  example: { no: exNo, en: exEn },
});

export const fieldPacks: VocabPack[] = [
  {
    id: "health",
    kind: "field",
    title: "Health & care",
    titleNo: "Helse og omsorg",
    emoji: "🩺",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("health-vakt", "en vakt", "a shift", "A2", "Jeg har kveldsvakt i dag.", "I'm on the evening shift today."),
      w("health-pasient", "en pasient", "a patient", "A2", "Pasienten har vondt i magen.", "The patient has a stomach ache."),
      w("health-beboer", "en beboer", "a resident (care home)", "B1", "Beboeren på rom tolv trenger hjelp.", "The resident in room twelve needs help."),
      w("health-medisin", "en medisin", "a medicine", "A2", "Hun skal ha medisinen klokka åtte.", "She gets her medicine at eight o'clock."),
      w("health-vondt", "å ha vondt", "to be in pain", "A1", "Har du vondt noe sted?", "Does it hurt anywhere?"),
      w("health-rapport", "en rapport", "a handover report", "B1", "Vi har rapport klokka tre.", "We have the handover at three o'clock."),
      w("health-hansker", "hansker", "gloves", "A2", "Husk å bruke hansker.", "Remember to wear gloves."),
      w("health-sykepleier", "en sykepleier", "a nurse", "A2", "Spør sykepleieren hvis du er usikker.", "Ask the nurse if you're unsure."),
    ],
  },
  {
    id: "construction",
    kind: "field",
    title: "Building & construction",
    titleNo: "Bygg og anlegg",
    emoji: "🦺",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("construction-hjelm", "en hjelm", "a helmet", "A2", "Du må ha på hjelm på byggeplassen.", "You must wear a helmet on the building site."),
      w("construction-verneutstyr", "verneutstyr", "safety gear", "B1", "Husk verneutstyret før du går inn.", "Remember your safety gear before you go in."),
      w("construction-stillas", "et stillas", "scaffolding", "B1", "Ikke gå opp på stillaset alene.", "Don't go up the scaffolding alone."),
      w("construction-bas", "en bas", "a foreman", "B1", "Spør basen hvis du lurer på noe.", "Ask the foreman if you're wondering about anything.", "informal"),
      w("construction-verktoy", "verktøy", "tools", "A2", "Legg verktøyet tilbake etter bruk.", "Put the tools back after use."),
      w("construction-bore", "å bore", "to drill", "A2", "Kan du bore et hull her?", "Can you drill a hole here?"),
      w("construction-betong", "betong", "concrete", "A2", "Betongen må tørke i to dager.", "The concrete has to dry for two days."),
      w("construction-matpause", "en matpause", "a lunch break", "A1", "Vi har matpause klokka elleve.", "We have our lunch break at eleven."),
    ],
  },
  {
    id: "logistics",
    kind: "field",
    title: "Warehouse & logistics",
    titleNo: "Lager og logistikk",
    emoji: "📦",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("logistics-lager", "et lager", "a warehouse", "A1", "Jeg jobber på lager.", "I work in a warehouse."),
      w("logistics-pall", "en pall", "a pallet", "A2", "Sett pallen ved port tre.", "Put the pallet by gate three."),
      w("logistics-truck", "en truck", "a forklift", "A2", "Har du truckførerbevis?", "Do you have a forklift licence?"),
      w("logistics-plukke", "å plukke", "to pick (orders)", "A2", "Jeg plukker ordrer hele dagen.", "I pick orders all day."),
      w("logistics-ordre", "en ordre", "an order", "A2", "Denne ordren skal sendes i dag.", "This order has to be sent today."),
      w("logistics-skift", "et skift", "a shift", "A2", "Neste skift begynner klokka to.", "The next shift starts at two."),
      w("logistics-hylle", "en hylle", "a shelf", "A1", "Varen står på øverste hylle.", "The item is on the top shelf."),
      w("logistics-forsiktig", "forsiktig", "careful", "A2", "Vær forsiktig, gulvet er glatt.", "Be careful, the floor is slippery."),
    ],
  },
  {
    id: "hospitality",
    kind: "field",
    title: "Restaurant & hotel",
    titleNo: "Restaurant og hotell",
    emoji: "🍽️",
    words: [
      w("hospitality-bestilling", "en bestilling", "an order", "A2", "Kan jeg ta bestillingen?", "Can I take your order?"),
      w("hospitality-regning", "en regning", "a bill", "A2", "Kan vi få regningen?", "Can we have the bill?"),
      w("hospitality-allergi", "en allergi", "an allergy", "A2", "Har du noen allergier?", "Do you have any allergies?"),
      w("hospitality-kjokken", "et kjøkken", "a kitchen", "A1", "Maten kommer fra kjøkkenet nå.", "The food is coming from the kitchen now."),
      w("hospitality-gjest", "en gjest", "a guest", "A2", "Gjesten på bord fem venter.", "The guest at table five is waiting."),
      w("hospitality-bord", "et bord", "a table", "A1", "Bord to vil bestille.", "Table two wants to order."),
      w("hospitality-sjekke-inn", "å sjekke inn", "to check in", "A2", "Gjesten vil sjekke inn tidlig.", "The guest wants to check in early."),
      w("hospitality-servere", "å servere", "to serve", "A2", "Vi serverer frokost fra klokka sju.", "We serve breakfast from seven o'clock."),
    ],
  },
  {
    id: "it",
    kind: "field",
    title: "IT & tech",
    titleNo: "IT og teknologi",
    emoji: "💻",
    words: [
      w("it-mote", "et møte", "a meeting", "A1", "Vi har et kort møte hver morgen.", "We have a short meeting every morning."),
      w("it-frist", "en frist", "a deadline", "B1", "Fristen er på fredag.", "The deadline is on Friday."),
      w("it-oppgave", "en oppgave", "a task", "A2", "Hvilken oppgave jobber du med?", "Which task are you working on?"),
      w("it-feil", "en feil", "a bug / an error", "A2", "Jeg fant en feil i koden.", "I found a bug in the code."),
      w("it-teste", "å teste", "to test", "A2", "Kan du teste dette før lunsj?", "Can you test this before lunch?"),
      w("it-losning", "en løsning", "a solution", "B1", "Vi trenger en bedre løsning.", "We need a better solution."),
      w("it-hjemmekontor", "hjemmekontor", "working from home", "B1", "Jeg har hjemmekontor på mandager.", "I work from home on Mondays."),
      w("it-kollega", "en kollega", "a colleague", "A2", "Kollegaen min hjelper meg.", "My colleague is helping me."),
    ],
  },
  {
    id: "education",
    kind: "field",
    title: "School & kindergarten",
    titleNo: "Skole og barnehage",
    emoji: "🏫",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("education-barnehage", "en barnehage", "a kindergarten", "A1", "Hun går i barnehagen.", "She goes to kindergarten."),
      w("education-laerer", "en lærer", "a teacher", "A1", "Læreren heter Kari.", "The teacher is called Kari."),
      w("education-lekser", "lekser", "homework", "A2", "Han har mye lekser i dag.", "He has a lot of homework today."),
      w("education-friminutt", "et friminutt", "a break (at school)", "A2", "Barna leker ute i friminuttet.", "The children play outside during the break."),
      w("education-matpakke", "en matpakke", "a packed lunch", "A2", "Husk matpakke til turen.", "Remember a packed lunch for the trip."),
      w("education-tur", "en tur", "a trip / an outing", "A1", "Klassen skal på tur i morgen.", "The class is going on a trip tomorrow."),
      w("education-henting", "henting", "pickup (of children)", "B1", "Henting er senest klokka fem.", "Pickup is at five o'clock at the latest."),
      w("education-foreldremote", "et foreldremøte", "a parents' meeting", "B1", "Det er foreldremøte på tirsdag.", "There's a parents' meeting on Tuesday."),
    ],
  },
  {
    id: "cleaning",
    kind: "field",
    title: "Cleaning",
    titleNo: "Renhold",
    emoji: "🧽",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("cleaning-vaske", "å vaske", "to wash / to clean", "A1", "Jeg vasker gulvet nå.", "I'm washing the floor now."),
      w("cleaning-stovsuge", "å støvsuge", "to vacuum", "A2", "Kan du støvsuge kontoret?", "Can you vacuum the office?"),
      w("cleaning-soppel", "søppel", "rubbish", "A2", "Tøm søppelet før du går.", "Empty the rubbish before you leave."),
      w("cleaning-vaskemiddel", "et vaskemiddel", "a cleaning product", "B1", "Ikke bland vaskemidler.", "Don't mix cleaning products."),
      w("cleaning-glatt", "glatt", "slippery", "A2", "Forsiktig, gulvet er glatt!", "Careful, the floor is slippery!"),
      w("cleaning-nokkel", "en nøkkel", "a key", "A1", "Jeg trenger nøkkelen til rom fire.", "I need the key to room four."),
      w("cleaning-ferdig", "ferdig", "done / finished", "A1", "Er du ferdig med toalettene?", "Are you done with the toilets?"),
      w("cleaning-torke-stov", "å tørke støv", "to dust", "B1", "Husk å tørke støv på hyllene.", "Remember to dust the shelves."),
    ],
  },
  {
    id: "transport",
    kind: "field",
    title: "Transport & driving",
    titleNo: "Transport",
    emoji: "🚌",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("transport-sjafor", "en sjåfør", "a driver", "A2", "Sjåføren venter ute.", "The driver is waiting outside."),
      w("transport-rute", "en rute", "a route", "A2", "Ruten går via Drammen i dag.", "The route goes via Drammen today."),
      w("transport-levering", "en levering", "a delivery", "A2", "Leveringen er forsinket.", "The delivery is delayed."),
      w("transport-forsinket", "forsinket", "delayed", "A2", "Bussen er ti minutter forsinket.", "The bus is ten minutes late."),
      w("transport-holdeplass", "en holdeplass", "a (bus/tram) stop", "A2", "Neste holdeplass er Jernbanetorget.", "The next stop is Jernbanetorget."),
      w("transport-billett", "en billett", "a ticket", "A1", "Har du billett?", "Do you have a ticket?"),
      w("transport-forerkort", "et førerkort", "a driving licence", "B1", "Har du norsk førerkort?", "Do you have a Norwegian driving licence?"),
      w("transport-ko", "kø", "a queue / traffic jam", "A2", "Det er mye kø på E18.", "There's a lot of traffic on the E18."),
    ],
  },
  {
    id: "student",
    kind: "field",
    title: "School & student life",
    titleNo: "Skole og studier",
    emoji: "🎒",
    ageGroups: ["teen", "young"],
    words: [
      w("student-time", "en time", "a lesson / class", "A2", "Første time er norsk.", "The first lesson is Norwegian."),
      w("student-prove", "en prøve", "a test", "A2", "Vi har prøve i matte i morgen.", "We have a maths test tomorrow."),
      w("student-karakter", "en karakter", "a grade", "B1", "Jeg fikk en god karakter.", "I got a good grade."),
      w("student-timeplan", "en timeplan", "a timetable", "A2", "Hva står på timeplanen i dag?", "What's on the timetable today?"),
      w("student-klassekamerat", "en klassekamerat", "a classmate", "A2", "Klassekameraten min heter Ali.", "My classmate is called Ali."),
      w("student-kantine", "ei kantine", "a canteen", "A1", "Vi spiser i kantina.", "We eat in the canteen.", "informal"),
      w("student-gruppearbeid", "et gruppearbeid", "group work", "B1", "Vi har gruppearbeid i dag.", "We have group work today."),
      w("student-fravaer", "fravær", "absence", "B1", "Du har for mye fravær.", "You have too much absence."),
    ],
  },
];

export const interestPacks: VocabPack[] = [
  {
    id: "football",
    kind: "interest",
    title: "Football",
    titleNo: "Fotball",
    emoji: "⚽",
    words: [
      w("football-kamp", "en kamp", "a match", "A1", "Skal vi se kampen i kveld?", "Shall we watch the match tonight?"),
      w("football-mal", "et mål", "a goal", "A1", "For et mål!", "What a goal!"),
      w("football-lag", "et lag", "a team", "A1", "Hvilket lag holder du med?", "Which team do you support?"),
      w("football-trening", "en trening", "a practice / training", "A2", "Jeg har trening på torsdag.", "I have practice on Thursday."),
      w("football-heie", "å heie", "to cheer", "A2", "Vi heier på Norge!", "We're cheering for Norway!"),
      w("football-dommer", "en dommer", "a referee", "B1", "Dommeren ga rødt kort.", "The referee gave a red card."),
    ],
  },
  {
    id: "cooking",
    kind: "interest",
    title: "Food & cooking",
    titleNo: "Mat og matlaging",
    emoji: "🍳",
    words: [
      w("cooking-middag", "en middag", "dinner", "A1", "Hva skal vi ha til middag?", "What are we having for dinner?"),
      w("cooking-smake", "å smake", "to taste", "A1", "Smak på sausen!", "Taste the sauce!"),
      w("cooking-koke", "å koke", "to boil", "A1", "Kok vann til pastaen.", "Boil water for the pasta."),
      w("cooking-steke", "å steke", "to fry", "A2", "Stek løken i fem minutter.", "Fry the onion for five minutes."),
      w("cooking-oppskrift", "en oppskrift", "a recipe", "A2", "Har du oppskriften?", "Do you have the recipe?"),
      w("cooking-ovn", "en ovn", "an oven", "A2", "Sett ovnen på to hundre grader.", "Set the oven to two hundred degrees."),
    ],
  },
  {
    id: "music",
    kind: "interest",
    title: "Music",
    titleNo: "Musikk",
    emoji: "🎸",
    words: [
      w("music-sang", "en sang", "a song", "A1", "Jeg elsker denne sangen.", "I love this song."),
      w("music-konsert", "en konsert", "a concert", "A1", "Skal du på konserten?", "Are you going to the concert?"),
      w("music-spille", "å spille", "to play (an instrument)", "A1", "Jeg spiller gitar.", "I play the guitar."),
      w("music-synge", "å synge", "to sing", "A1", "Hun synger i kor.", "She sings in a choir."),
      w("music-band", "et band", "a band", "A1", "Bandet spiller på lørdag.", "The band is playing on Saturday."),
      w("music-ove", "å øve", "to practise", "A2", "Vi øver hver onsdag.", "We practise every Wednesday."),
    ],
  },
  {
    id: "gaming",
    kind: "interest",
    title: "Gaming",
    titleNo: "Gaming",
    emoji: "🎮",
    words: [
      w("gaming-spill", "et spill", "a game", "A1", "Hvilket spill spiller du?", "Which game are you playing?"),
      w("gaming-vinne", "å vinne", "to win", "A1", "Vi vant!", "We won!"),
      w("gaming-tape", "å tape", "to lose", "A2", "Vi tapte igjen.", "We lost again."),
      w("gaming-niva", "et nivå", "a level", "A2", "Jeg er på nivå ti.", "I'm on level ten."),
      w("gaming-lagre", "å lagre", "to save", "A2", "Husk å lagre spillet.", "Remember to save the game."),
      w("gaming-lagkamerat", "en lagkamerat", "a teammate", "B1", "Lagkameraten min er fra Bergen.", "My teammate is from Bergen."),
    ],
  },
  {
    id: "outdoors",
    kind: "interest",
    title: "Outdoors & hiking",
    titleNo: "Friluftsliv",
    emoji: "🏔️",
    words: [
      w("outdoors-tur", "å gå på tur", "to go for a hike / walk", "A1", "Skal vi gå på tur i helga?", "Shall we go for a hike at the weekend?"),
      w("outdoors-fjell", "et fjell", "a mountain", "A1", "Vi drar til fjells i påsken.", "We're going to the mountains at Easter."),
      w("outdoors-hytte", "ei hytte", "a cabin", "A1", "Vi er på hytta i helga.", "We're at the cabin this weekend.", "informal"),
      w("outdoors-ski", "å gå på ski", "to ski (cross-country)", "A1", "Kan du gå på ski?", "Can you ski?"),
      w("outdoors-sekk", "en sekk", "a backpack", "A2", "Pakk sekken kvelden før.", "Pack your backpack the night before."),
      w("outdoors-utsikt", "en utsikt", "a view", "A2", "For en utsikt!", "What a view!"),
    ],
  },
  {
    id: "family",
    kind: "interest",
    title: "Family life",
    titleNo: "Familieliv",
    emoji: "👨‍👩‍👧",
    ageGroups: ["young", "adult", "senior"],
    words: [
      w("family-hjemme", "hjemme", "at home", "A1", "Er du hjemme i kveld?", "Are you at home tonight?"),
      w("family-bursdag", "en bursdag", "a birthday", "A1", "Når har du bursdag?", "When is your birthday?"),
      w("family-besoke", "å besøke", "to visit", "A2", "Vi besøker dem i jula.", "We're visiting them at Christmas."),
      w("family-barnebarn", "et barnebarn", "a grandchild", "A2", "Jeg har tre barnebarn.", "I have three grandchildren."),
      w("family-svigerfamilie", "en svigerfamilie", "in-laws", "B1", "Jeg møter svigerfamilien på søndag.", "I'm meeting my in-laws on Sunday."),
      w("family-familieselskap", "et familieselskap", "a family party", "B1", "Vi har familieselskap på lørdag.", "We're having a family party on Saturday."),
    ],
  },
];

/** Every pack, incl. T21 seasonal packs (shown only while their season runs). */
export const vocabPacks: VocabPack[] = [...everydayPacks, ...fieldPacks, ...interestPacks, ...seasonPacks];
// T24: every word gets its picture (everyday words bring their own).
for (const pack of vocabPacks) for (const word of pack.words) word.picture ??= WORD_PICTURES[word.id];
export const vocabWords: VocabWord[] = vocabPacks.flatMap((p) => p.words);

export function getVocabWord(id: string): VocabWord | undefined {
  return vocabWords.find((x) => x.id === id);
}

/** The pack a word belongs to (ids start with the pack id). */
export function packOfWord(id: string): VocabPack | undefined {
  return vocabPacks.find((p) => p.words.some((x) => x.id === id));
}

export function getPack(id: string): VocabPack | undefined {
  return vocabPacks.find((p) => p.id === id);
}

export function packFitsAge(pack: VocabPack, age: AgeGroup | null): boolean {
  return !age || !pack.ageGroups || pack.ageGroups.includes(age);
}

export const FIELD_IDS = fieldPacks.map((p) => p.id as FieldId);
export const INTEREST_IDS = interestPacks.map((p) => p.id as InterestId);
