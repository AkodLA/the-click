// Shared types between the worker app, the API and the manager dashboard.

export type EventKind =
  | "session_start" // worker started talking to the agent
  | "step_done" // worker finished a step in a task
  | "task_done" // worker finished a whole task
  | "problem" // empty shelf, damaged item, etc.
  | "question" // agent could not answer from the SOPs -> manager must answer
  | "return_grade"; // agent suggested a grade for a returned item

export type ProblemType = "tom_hylle" | "skadet_vare" | "feil_vare" | "annet";

export interface FeedEvent {
  id: string;
  created_at: string; // ISO timestamp
  worker: string;
  language: string; // language code the worker spoke, e.g. "so"
  kind: EventKind;
  /** Always Norwegian – this is what the manager reads. */
  text_no: string;
  /** What the worker actually said, in their own language (optional). */
  text_original?: string | null;
  /** Extra structured info, e.g. { shelf: "B-12", grade: "A" }. */
  meta?: Record<string, string> | null;
}

export type NewFeedEvent = Omit<FeedEvent, "id" | "created_at">;
