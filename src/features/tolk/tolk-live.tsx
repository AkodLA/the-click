"use client";
/**
 * Live Tolk session with the ElevenLabs interpreter agent (agent/tolk-prompt.md). Owner: T8.
 * The browser only gets a short-lived signed URL from our server (POST /api/agent/signed-url);
 * the API key never reaches the browser. Nothing is stored: the transcript lives in this tab only.
 */
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { stripVoiceTags } from "@/lib/voice-text";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";
import type { TolkLanguage, TolkSetting, TolkTurn } from "./tolk-data";
import { TolkTable } from "./tolk-table";

type Tools = {
  show_translation: (params: { spoken_language?: string; original?: string; translation?: string }) => string;
};

export function TolkLive(props: {
  langA: TolkLanguage;
  langB: TolkLanguage;
  setting: TolkSetting;
  onEnd: (turns: TolkTurn[]) => void;
  onFail: (message: string, code?: string) => void;
}) {
  return (
    <ConversationProvider>
      <LiveSession {...props} />
    </ConversationProvider>
  );
}

function LiveSession({
  langA,
  langB,
  setting,
  onEnd,
  onFail,
}: {
  langA: TolkLanguage;
  langB: TolkLanguage;
  setting: TolkSetting;
  onEnd: (turns: TolkTurn[]) => void;
  onFail: (message: string, code?: string) => void;
}) {
  const [turns, setTurns] = useState<TolkTurn[]>([]);
  const turnsRef = useRef<TolkTurn[]>([]);
  const seq = useRef(0);
  const toolUsed = useRef(false);
  const pendingOriginal = useRef<string | null>(null);
  const started = useRef(false);
  const ended = useRef(false);

  function addTurn(t: Omit<TolkTurn, "id">) {
    const turn = { ...t, id: ++seq.current };
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
  }

  const conversation = useConversation({
    onMessage: ({ message: raw, source }) => {
      const message = stripVoiceTags(raw ?? "");
      // Fallback when the agent doesn't call show_translation: pair "what was said" with "the translation".
      if (toolUsed.current || !message) return;
      if (source === "user") pendingOriginal.current = message;
      else if (pendingOriginal.current) {
        addTurn({ speaker: "unknown", original: pendingOriginal.current, translation: message });
        pendingOriginal.current = null;
      }
    },
    onError: (message) => {
      if (!ended.current) onFail(typeof message === "string" ? message : "The voice connection failed.");
    },
    onDisconnect: (details) => {
      if (ended.current) return;
      ended.current = true;
      if (details.reason === "error") onFail("The connection dropped. Check your internet and try again.");
      else onEnd(turnsRef.current);
    },
  });

  useConversationClientTool<Tools>("show_translation", (params) => {
    const original = String(params.original ?? "").slice(0, 2000);
    const translation = String(params.translation ?? "").slice(0, 2000);
    if (!original && !translation) return "ignored";
    toolUsed.current = true;
    pendingOriginal.current = null;
    const speaker = params.spoken_language === "a" ? "a" : params.spoken_language === "b" ? "b" : "unknown";
    addTurn({ speaker, original, translation });
    return "shown";
  });

  // Start once: mic permission first, then a fresh signed URL, then the session.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop()); // the SDK opens its own stream
      } catch {
        onFail("Tolk needs the microphone. Allow it in your browser settings and try again.", "mic_denied");
        return;
      }
      try {
        const { signedUrl } = await apiFetch<{ signedUrl: string }>("/api/agent/signed-url", {
          method: "POST",
          body: JSON.stringify({ mode: "tolk" }),
        });
        conversation.startSession({
          signedUrl,
          connectionType: "websocket",
          dynamicVariables: {
            lang_a: langA.code,
            lang_a_name: langA.name,
            lang_b: langB.code,
            lang_b_name: langB.name,
            setting: setting.agentContext,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const code = msg.split(":")[0];
        onFail(code === "not_configured" ? "Live interpreting isn't set up on this server yet." : "Couldn't start Tolk right now.", code);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start exactly once
  }, []);

  // Leaving the page ends the session (no hidden open mic).
  useEffect(
    () => () => {
      ended.current = true;
      conversation.endSession();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only
    [],
  );

  function finish() {
    ended.current = true;
    conversation.endSession();
    onEnd(turnsRef.current);
  }

  const status =
    conversation.status === "connected"
      ? conversation.isSpeaking
        ? { text: "Interpreting…", tone: "speaking" as const }
        : conversation.isMuted
          ? { text: "Paused", tone: "idle" as const }
          : { text: "Listening…", tone: "listening" as const }
      : conversation.status === "disconnected"
        ? { text: "Not connected", tone: "error" as const }
        : { text: "Connecting…", tone: "idle" as const };

  return (
    <TolkTable
      langA={langA}
      langB={langB}
      turns={turns}
      status={status}
      controls={
        <>
          <Button
            variant="secondary"
            onClick={() => conversation.setMuted(!conversation.isMuted)}
            disabled={conversation.status !== "connected"}
            aria-pressed={conversation.isMuted}
          >
            {conversation.isMuted ? "▶️ Resume" : "⏸️ Pause"}
          </Button>
          <Button variant="accent" onClick={finish}>
            ⏹️ End
          </Button>
        </>
      }
    />
  );
}
