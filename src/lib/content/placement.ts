/**
 * Placement test questions (public). Owner: T4 (flow), T3 (questions).
 * The ANSWER KEY and the scoring live server-side in src/server/placement.ts:
 * the browser sends the chosen option index per question, and the server returns the level.
 * If you add or change a question here, update the answer key there too.
 */
import type { PlacementQuestion } from "./types";

export const placementQuestions: PlacementQuestion[] = [
  { id: "q1", level: "A1", type: "choice", prompt: "What does «Hei» mean?", options: ["Goodbye", "Thanks", "Hello", "Sorry"] },
  { id: "q2", level: "A1", type: "listen", prompt: "Listen. What did you hear?", norwegian: "Jeg heter Sara.", options: ["I live in Sara.", "My name is Sara.", "I like Sara.", "Sara is here."] },
  { id: "q3", level: "A2", type: "choice", prompt: "A friend asks «Skal vi ta en kaffe?». What's a natural answer?", options: ["De er velkommen.", "Jeg lurer på om kaffe.", "Ha det bra.", "Gjerne!"] },
  { id: "q4", level: "A2", type: "speak", prompt: "Say this out loud:", norwegian: "Jeg kommer fra Spania, men jeg bor i Oslo." },
  { id: "q5", level: "B1", type: "choice", prompt: "You meet your neighbour again after their dinner party. What do Norwegians say first?", options: ["Halla, skjer'a?", "God natt!", "Takk for sist!", "Unnskyld meg."] },
  { id: "q6", level: "B1", type: "choice", prompt: "Which one is best in an email to your child's teacher?", options: ["Skjer'a, kan vi snakke?", "Jeg lurer på om vi kan ta en prat.", "Gidder du å ringe?", "Det er sykt viktig, ass."] },
  { id: "q7", level: "B2", type: "choice", prompt: "«Det koster skjorta» means…", options: ["The shirt is on sale.", "It doesn't matter.", "It's too small.", "It's very expensive."] },
  { id: "q8", level: "C1", type: "choice", prompt: "«Å ta seg vann over hodet» means…", options: ["To take on more than you can handle", "To go swimming", "To wash your hair", "To be very calm"] },
  { id: "q9", level: "C2", type: "choice", prompt: "Which sentence sounds most natural in spoken Norwegian?", options: ["Dagen var av en litt nå.", "Det en dag var litt.", "Det var nå litt av en dag, da.", "Litt dag det var nå."] },
];
