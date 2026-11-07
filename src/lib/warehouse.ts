// Fake test data for a fictional warehouse. NEVER real customer data.
// The step texts mirror agent/kunnskapsbase/lager-rutiner.md – keep them in sync.

export interface TaskStep {
  number: number;
  text_no: string;
}

export interface Task {
  id: string;
  title_no: string;
  flow: "varemottak" | "lagring" | "plukk" | "pakking" | "utsending" | "retur";
  steps: TaskStep[];
}

export const WAREHOUSE_NAME = "Lager Alna (testlager)";

export const WORKERS = ["Amina", "Olena", "Piotr", "Yusuf"];

export const TASKS: Task[] = [
  {
    id: "retur",
    title_no: "Behandle en retur",
    flow: "retur",
    steps: [
      { number: 1, text_no: "Åpne Holio Ops og trykk «Retur»." },
      { number: 2, text_no: "Skann returetiketten på pakken. Ordren kommer opp på skjermen." },
      { number: 3, text_no: "Åpne pakken og sjekk at varen er den samme som på ordren." },
      {
        number: 4,
        text_no:
          "Vurder varen: A = som ny, kan selges igjen. B = liten feil, selges med rabatt. C = skadet eller brukt, tas ut av salg.",
      },
      { number: 5, text_no: "Velg A, B eller C i appen og ta ett bilde av varen." },
      { number: 6, text_no: "A og B: legg varen på returhylla R-1. C: legg varen i den røde kassa." },
    ],
  },
  {
    id: "varemottak",
    title_no: "Ta imot en leveranse",
    flow: "varemottak",
    steps: [
      { number: 1, text_no: "Trykk «Varemottak» i Holio Ops og skann strekkoden på følgeseddelen." },
      { number: 2, text_no: "Innkjøpsordren kommer opp. Sjekk at leverandøren stemmer." },
      { number: 3, text_no: "Skann hver vare. Appen teller antallet for deg." },
      {
        number: 4,
        text_no: "Mangler noe, eller er noe skadet? Trykk «Avvik» og ta bilde. Ikke ta imot skadde varer.",
      },
      { number: 5, text_no: "Trykk «Fullfør mottak». Appen viser hvilken hylleplass varene skal på." },
    ],
  },
  {
    id: "plukk",
    title_no: "Plukke en ordre",
    flow: "plukk",
    steps: [
      { number: 1, text_no: "Trykk «Plukk» i Holio Ops. Appen viser første vare og hylleplass." },
      { number: 2, text_no: "Gå til hylleplassen. Skann hylleplassen først, så varen." },
      { number: 3, text_no: "Sjekk farge og størrelse mot skjermen. Strekkoden er lik for alle farger på noen varer." },
      { number: 4, text_no: "Tom hylle? Trykk «Tom plass» – ikke ta varen fra en annen hylle uten å skanne." },
      { number: 5, text_no: "Når alle varene er plukket, lever kurven ved pakkebordet." },
    ],
  },
  {
    id: "pakking",
    title_no: "Pakke en ordre",
    flow: "pakking",
    steps: [
      { number: 1, text_no: "Skann kurven ved pakkebordet. Ordren kommer opp." },
      { number: 2, text_no: "Skann hver vare en gang til før den legges i esken." },
      { number: 3, text_no: "Bruk esken appen foreslår. Fyll luft med papir, ikke plast." },
      { number: 4, text_no: "Trykk «Skriv ut etikett» og fest fraktetiketten på toppen av esken." },
      { number: 5, text_no: "Sett pakken på riktig transportør-pall: Bring eller PostNord." },
    ],
  },
];

export function findTask(id: string): Task | undefined {
  return TASKS.find((t) => t.id === id);
}
