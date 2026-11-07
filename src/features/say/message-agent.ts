"use client";
/**
 * T23: ask the "Snakk Message" ElevenLabs agent (agent/message-prompt.md) for the natural Norwegian version.
 * Text-only session: no microphone, no audio, one message, then the session is closed.
 * The browser only gets a short-lived signed URL (POST /api/agent/signed-url, mode "message"); the key stays on the server.
 */
import { Conversation } from "@elevenlabs/react";
import { apiFetch } from "@/lib/api-client";
import type { Register } from "@/lib/content/types";
import { stripVoiceTags } from "@/lib/voice-text";

export interface AgentMessage {
  norwegian: string;
  register: Register | null;
  literal?: string;
  tip?: string;
}

const REGISTERS: Register[] = ["slang", "informal", "neutral", "formal"];
const TIME_LIMIT_MS = 15_000;

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** null = the agent couldn't help (not set up, offline, timed out): the caller falls back to the device translator. */
export async function askMessageAgent(
  english: string,
  vars: { tone: "friendly" | "polite"; learner_level: string; context: string },
): Promise<AgentMessage | null> {
  let signedUrl: string;
  try {
    ({ signedUrl } = await apiFetch<{ signedUrl: string }>("/api/agent/signed-url", {
      method: "POST",
      body: JSON.stringify({ mode: "message" }),
    }));
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    let conv: { endSession: () => Promise<void> } | null = null;
    let done = false;
    const finish = (r: AgentMessage | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      conv?.endSession().catch(() => {});
      resolve(r);
    };
    const timer = setTimeout(() => finish(null), TIME_LIMIT_MS);

    Conversation.startSession({
      signedUrl,
      textOnly: true,
      connectionType: "websocket",
      dynamicVariables: vars,
      clientTools: {
        show_message: (p: Record<string, unknown>) => {
          const norwegian = clip(p.norwegian, 600);
          const register = REGISTERS.includes(p.register as Register) ? (p.register as Register) : null;
          finish({ norwegian, register, literal: clip(p.literal, 600) || undefined, tip: clip(p.tip, 200) || undefined });
          return "shown";
        },
      },
      // Fallback if the agent answers without calling the tool: its reply IS the Norwegian text.
      onMessage: ({ message, source }) => {
        if (source !== "user" && message) finish({ norwegian: stripVoiceTags(message).slice(0, 600), register: null });
      },
      onError: () => finish(null),
      onDisconnect: () => finish(null),
    })
      .then((c) => {
        conv = c;
        if (done) c.endSession().catch(() => {});
        else c.sendUserMessage(english);
      })
      .catch(() => finish(null));
  });
}
