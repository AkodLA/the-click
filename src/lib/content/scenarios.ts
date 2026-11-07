/**
 * Real-life speaking scenarios for the voice tutor. Owner: T3 (content) + T2 (agent behaviour).
 */
import type { Scenario } from "./types";

export const scenarios: Scenario[] = [
  {
    id: "kiosk",
    title: "Buying a coffee at the kiosk",
    emoji: "☕",
    level: "A1",
    register: "informal",
    goal: "Order a coffee and a bun, ask the price, say thanks.",
    agentRole: "a friendly kiosk worker in Oslo",
    openingLine: "Hei! Hva skal det være?",
    keyPhraseIds: ["kjempe", "snakkes"],
    xpReward: 30,
  },
  {
    id: "party",
    title: "Small talk at a party",
    emoji: "🎉",
    level: "A2",
    register: "slang",
    goal: "Greet someone your age, ask what they do, make a plan for the weekend.",
    agentRole: "a relaxed 24-year-old from Oslo at a house party",
    openingLine: "Halla! Har vi møttes før?",
    keyPhraseIds: ["halla", "skjer-a", "digg", "chille"],
    xpReward: 40,
  },
  {
    id: "work-lunch",
    title: "Lunch with new colleagues",
    emoji: "🥪",
    level: "B1",
    register: "informal",
    goal: "Introduce yourself, talk about the weekend, use «takk for sist» naturally.",
    agentRole: "a friendly colleague at a Norwegian workplace lunch",
    openingLine: "Hei, du er ny her, ikke sant? Hvordan går det?",
    keyPhraseIds: ["takk-for-sist", "kjempe", "snakkes"],
    xpReward: 50,
  },
  {
    id: "parent-meeting",
    title: "Parent-teacher meeting",
    emoji: "🏫",
    level: "B1",
    register: "neutral",
    goal: "Ask how your child is doing, ask one follow-up question, thank the teacher.",
    agentRole: "a kind primary-school teacher at a parent-teacher meeting",
    openingLine: "Velkommen! Fint at du kunne komme. Skal vi begynne?",
    keyPhraseIds: ["du-not-de", "jeg-lurer-pa"],
    xpReward: 60,
  },
  {
    id: "doctor",
    title: "Calling your GP (fastlege)",
    emoji: "🩺",
    level: "B2",
    register: "formal",
    goal: "Book an appointment and explain your symptoms politely.",
    agentRole: "a receptionist at a Norwegian GP office",
    openingLine: "Legekontoret, hva kan jeg hjelpe deg med?",
    keyPhraseIds: ["jeg-lurer-pa"],
    xpReward: 70,
  },
  {
    id: "job-interview",
    title: "Job interview",
    emoji: "💼",
    level: "B2",
    register: "formal",
    goal: "Present yourself and avoid slang. The tutor will catch it if you slip!",
    agentRole: "an HR manager interviewing you for a job",
    openingLine: "Velkommen. Kan du starte med å fortelle litt om deg selv?",
    keyPhraseIds: ["jeg-lurer-pa", "du-not-de"],
    xpReward: 80,
  },
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
