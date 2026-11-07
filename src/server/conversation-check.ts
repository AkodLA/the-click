import "server-only";
import { env } from "./env";

/**
 * T13: before the server gives XP for `scenario_completed`, check with ElevenLabs that the tutor conversation
 * really happened. Without this, anyone could POST { type: "scenario_completed" } and farm XP.
 *
 * Checks: the conversation exists, belongs to OUR tutor agent, started recently, wasn't already used,
 * and the learner actually spoke. The slang count comes from the tutor's own `flag_register` tool calls,
 * not from the browser.
 */

const MAX_AGE_SEC = 3 * 60 * 60; // a conversation must have started in the last 3 hours
const MIN_LEARNER_TURNS = 2;
const USED_LIMIT = 5000;

/** Best-effort replay protection (per server instance; T17 moves this to a database). */
const used = new Map<string, number>();

interface TranscriptEntry {
  role?: string;
  message?: string | null;
  tool_calls?: { tool_name?: string }[] | null;
}
interface Conversation {
  agent_id?: string;
  status?: string;
  transcript?: TranscriptEntry[];
  metadata?: { start_time_unix_secs?: number };
  conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> } | null;
}

export type ConversationCheck =
  | { ok: true; verified: boolean; slangFlags?: number }
  | { ok: false; code: string; message: string; status: number };

export async function checkTutorConversation(conversationId: string | undefined, scenarioId: string): Promise<ConversationCheck> {
  const { ELEVENLABS_API_KEY, ELEVENLABS_TUTOR_AGENT_ID, NODE_ENV } = env();

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_TUTOR_AGENT_ID) {
    // Local development without voice keys: allow, so teammates can build the UI.
    if (NODE_ENV !== "production") return { ok: true, verified: false };
    return { ok: false, code: "not_configured", message: "The voice tutor is not set up", status: 503 };
  }
  if (!conversationId || !/^[\w-]{6,128}$/.test(conversationId)) {
    return { ok: false, code: "unverified", message: "Finish a conversation with the tutor to get XP", status: 400 };
  }
  if (used.has(conversationId)) {
    return { ok: false, code: "already_used", message: "This conversation already gave XP", status: 409 };
  }

  let conv: Conversation;
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(conversationId)}`, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (res.status === 404) return { ok: false, code: "unverified", message: "Unknown conversation", status: 400 };
    if (!res.ok) {
      console.error("conversation check failed", res.status);
      return { ok: false, code: "verify_unavailable", message: "Couldn't check the conversation. Try again.", status: 503 };
    }
    conv = (await res.json()) as Conversation;
  } catch (err) {
    console.error("conversation check error", err);
    return { ok: false, code: "verify_unavailable", message: "Couldn't check the conversation. Try again.", status: 503 };
  }

  if (conv.agent_id !== ELEVENLABS_TUTOR_AGENT_ID) {
    return { ok: false, code: "unverified", message: "That conversation wasn't with the Snakk tutor", status: 400 };
  }
  if (conv.status === "failed" || conv.status === "initiated") {
    return { ok: false, code: "unverified", message: "That conversation didn't finish", status: 400 };
  }
  const started = conv.metadata?.start_time_unix_secs;
  if (typeof started === "number" && Date.now() / 1000 - started > MAX_AGE_SEC) {
    return { ok: false, code: "unverified", message: "That conversation is too old", status: 400 };
  }
  const transcript = conv.transcript ?? [];
  const learnerTurns = transcript.filter((t) => t.role === "user" && (t.message ?? "").trim().length > 0).length;
  if (learnerTurns < MIN_LEARNER_TURNS) {
    return { ok: false, code: "too_short", message: "Say a bit more to the tutor to finish the scenario", status: 400 };
  }
  // If the app sent the scenario as a dynamic variable (T2: `scenario_id`), it must match.
  const sentScenario = conv.conversation_initiation_client_data?.dynamic_variables?.scenario_id;
  if (typeof sentScenario === "string" && sentScenario !== scenarioId) {
    return { ok: false, code: "unverified", message: "That conversation was for another scenario", status: 400 };
  }

  if (used.size >= USED_LIMIT) used.delete(used.keys().next().value as string);
  used.set(conversationId, Date.now());

  const slangFlags = transcript.reduce(
    (n, t) => n + (t.tool_calls ?? []).filter((c) => c.tool_name === "flag_register").length,
    0,
  );
  return { ok: true, verified: true, slangFlags };
}
