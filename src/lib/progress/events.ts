/**
 * SHARED CONTRACT: the progress events the browser may send to POST /api/progress/event.
 * The browser says WHAT happened; the server decides HOW MUCH it's worth (XP, achievements, caps).
 * The browser never sends an XP amount.
 */
import { z } from "zod";

const id = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i);

export const progressEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("profile_set"),
    // Nickname only, never a real name: letters, digits, _ and -. 3–20 characters.
    nickname: z.string().trim().min(3).max(20).regex(/^[\p{L}\p{N}_-]+$/u, "Use letters, numbers, _ or -"),
    nativeLanguage: z.string().regex(/^[a-z]{2,3}$/),
  }),
  z.object({
    type: z.literal("placement_submitted"),
    /** question id -> chosen option index */
    answers: z.record(id, z.number().int().min(0).max(9)),
  }),
  z.object({ type: z.literal("phrase_learned"), phraseId: id }),
  /** T20: a vocabulary word from the personal packs. */
  z.object({ type: z.literal("word_learned"), wordId: id }),
  z.object({
    type: z.literal("scenario_completed"),
    scenarioId: id,
    /** ElevenLabs conversation id. T2/T13: the server can verify it with ElevenLabs. */
    conversationId: z.string().max(128).optional(),
    /** How many times the tutor flagged slang in the wrong place. */
    slangFlags: z.number().int().min(0).max(100).optional(),
  }),
  z.object({ type: z.literal("event_checkin"), eventId: id }),
  z.object({ type: z.literal("writing_done"), itemId: id }),
  z.object({ type: z.literal("tandem_message_sent") }),
]);

export type ProgressEvent = z.infer<typeof progressEventSchema>;

/** A toast to show after the server applied an event. */
export interface RewardNotice {
  emoji: string;
  title: string;
  detail: string;
}
