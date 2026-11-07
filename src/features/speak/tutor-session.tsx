"use client";
/**
 * Live voice session with the Snakk tutor (agent/tutor-prompt.md). Owner: T2.
 * - The browser gets a short-lived signed URL from POST /api/agent/signed-url (the key stays on the server).
 * - Client tools from the agent: flag_register (correction card) and scenario_complete (end + report).
 * - XP: the parent sends `scenario_completed` with the conversation id; the SERVER checks the conversation with
 *   ElevenLabs and counts the slang flags itself (src/server/conversation-check.ts).
 */
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, RegisterTag } from "@/components/ui";
import { TranslateButton } from "@/features/translate/translate-button";
import { ExplainText } from "@/features/explain/explain-text";
import { apiFetch } from "@/lib/api-client";
import { getPack, getPhrase, LANGUAGE_NAMES } from "@/lib/content";
import type { Register, Scenario } from "@/lib/content/types";
import { usePrefs } from "@/lib/personal/prefs";
import { recordMistake } from "@/lib/personal/mistakes";
import { useProgress } from "@/lib/progress/store";

export interface Correction {
  said: string;
  register: Register | null;
  better: string;
}

export interface SessionOutcome {
  conversationId: string | null;
  learnerTurns: number;
  slangFlags: number;
  corrections: Correction[];
}

interface Line {
  id: number;
  from: "tutor" | "me";
  text: string;
}

type Tools = {
  flag_register: (p: { said?: string; register?: string; better?: string }) => string;
  scenario_complete: (p: { slang_flags?: number }) => string;
};

const REGISTERS: Register[] = ["slang", "informal", "neutral", "formal"];

export function TutorSession(props: {
  scenario: Scenario;
  onFinish: (outcome: SessionOutcome) => void;
  onFail: (message: string, code?: string) => void;
}) {
  return (
    <ConversationProvider>
      <Session {...props} />
    </ConversationProvider>
  );
}

function Session({
  scenario,
  onFinish,
  onFail,
}: {
  scenario: Scenario;
  onFinish: (outcome: SessionOutcome) => void;
  onFail: (message: string, code?: string) => void;
}) {
  const p = useProgress();
  const prefs = usePrefs();
  const [lines, setLines] = useState<Line[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const seq = useRef(0);
  const conversationId = useRef<string | null>(null);
  const learnerTurns = useRef(0);
  const correctionsRef = useRef<Correction[]>([]);
  const started = useRef(false);
  const finished = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onFinish({
      conversationId: conversationId.current,
      learnerTurns: learnerTurns.current,
      slangFlags: correctionsRef.current.length,
      corrections: correctionsRef.current,
    });
  }

  const conversation = useConversation({
    onConnect: ({ conversationId: id }) => {
      conversationId.current = id;
    },
    onMessage: ({ message, source }) => {
      if (!message?.trim()) return;
      if (source === "user") learnerTurns.current += 1;
      setLines((l) => [...l.slice(-30), { id: ++seq.current, from: source === "user" ? "me" : "tutor", text: message }]);
    },
    onError: (message) => {
      if (!finished.current) onFail(typeof message === "string" ? message : "The voice connection failed.");
    },
    onDisconnect: (details) => {
      if (finished.current) return;
      if (details.reason === "error") {
        finished.current = true;
        onFail("The connection dropped. Check your internet and try again.");
      } else finish(); // the agent ended the call
    },
  });

  useConversationClientTool<Tools, "flag_register">("flag_register", (params) => {
    const reg = REGISTERS.includes(params.register as Register) ? (params.register as Register) : null;
    const c: Correction = {
      said: String(params.said ?? "").slice(0, 200),
      register: reg,
      better: String(params.better ?? "").slice(0, 200),
    };
    if (!c.said && !c.better) return "ignored";
    correctionsRef.current = [...correctionsRef.current, c];
    recordMistake({ source: "tutor", said: c.said, better: c.better, note: c.register ? `«${c.said}» is ${c.register} here` : undefined }); // T21 notebook
    setCorrections(correctionsRef.current);
    return "shown";
  });

  useConversationClientTool<Tools, "scenario_complete">("scenario_complete", () => {
    // Let the goodbye finish playing, then end.
    setTimeout(() => {
      conversation.endSession();
      finish();
    }, 1500);
    return "ok";
  });

  // Start once: mic permission, signed URL, then the session with the scenario as dynamic variables.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        onFail("The tutor needs your microphone. Allow it in your browser settings and try again.", "mic_denied");
        return;
      }
      try {
        const { signedUrl } = await apiFetch<{ signedUrl: string }>("/api/agent/signed-url", {
          method: "POST",
          body: JSON.stringify({ mode: "tutor", scenarioId: scenario.id }),
        });
        const keyPhrases = scenario.keyPhraseIds.map((id) => getPhrase(id)?.text).filter(Boolean).join(", ");
        conversation.startSession({
          signedUrl,
          connectionType: "websocket",
          dynamicVariables: {
            scenario_id: scenario.id,
            scenario_title: scenario.title,
            agent_role: scenario.agentRole,
            goal: scenario.goal,
            register: scenario.register,
            learner_level: p.cefr ?? "A1",
            opening_line: scenario.openingLine,
            nickname: p.nickname || "friend",
            native_language: LANGUAGE_NAMES[p.nativeLanguage] ?? "English",
            key_phrases: keyPhrases || "none",
            // T20: talk about the learner's world (device-only settings; group, never an exact age).
            age_group: prefs.ageGroup ?? "unknown",
            field: (prefs.field && getPack(prefs.field)?.title) || "unknown",
            interests: prefs.interests.map((i) => getPack(i)?.title ?? i).join(", ") || "unknown",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const code = msg.split(":")[0];
        onFail(code === "not_configured" ? "The voice tutor isn't set up on this server yet." : "Couldn't start the tutor right now.", code);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start exactly once
  }, []);

  // Leaving the page ends the session: no hidden open mic.
  useEffect(
    () => () => {
      finished.current = true;
      conversation.endSession();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only
    [],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines.length, corrections.length]);

  const status =
    conversation.status === "connected"
      ? conversation.isSpeaking
        ? { text: "Tutor is speaking…", dot: "bg-accent animate-pulse" }
        : conversation.isMuted
          ? { text: "Paused", dot: "bg-muted" }
          : { text: "Your turn: speak!", dot: "bg-success animate-pulse" }
      : conversation.status === "disconnected"
        ? { text: "Not connected", dot: "bg-danger" }
        : { text: "Connecting…", dot: "bg-muted" };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
          {scenario.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{scenario.title}</p>
          <p className="flex items-center gap-2 text-sm font-semibold text-muted" aria-live="polite">
            <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} aria-hidden />
            {status.text}
          </p>
        </div>
      </Card>

      <p className="rounded-2xl bg-brand-soft p-3 text-sm">
        <span className="font-bold text-brand">🎯 Goal: </span>
        {scenario.goal}
      </p>

      <div className="flex min-h-48 flex-col gap-3" aria-label="Conversation" aria-live="polite">
        {lines.length === 0 && <p className="py-8 text-center text-muted">The tutor starts. Then just talk, like in real life.</p>}
        {lines.map((l) => (
          <div key={l.id} className={`flex flex-col ${l.from === "me" ? "items-end" : "items-start"}`}>
            <p
              lang="nb"
              className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                l.from === "me" ? "rounded-br-lg bg-brand text-brand-ink" : "rounded-bl-lg border border-line bg-surface shadow-sm"
              }`}
            >
              {l.from === "tutor" ? <ExplainText text={l.text} /> : l.text}
            </p>
            {/* T19: on-device translation of what the tutor said, into the learner's language. */}
            {l.from === "tutor" && <TranslateButton text={l.text} from="nb" to={p.nativeLanguage} />}
          </div>
        ))}
        {corrections.length > 0 && <CorrectionCard c={corrections[corrections.length - 1]} />}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 z-10 grid grid-cols-2 gap-2 rounded-3xl border border-line bg-surface p-3 shadow-lg md:bottom-4">
        <Button
          variant="secondary"
          onClick={() => conversation.setMuted(!conversation.isMuted)}
          disabled={conversation.status !== "connected"}
          aria-pressed={conversation.isMuted}
        >
          {conversation.isMuted ? "▶️ Resume" : "⏸️ Pause"}
        </Button>
        <Button
          variant="accent"
          onClick={() => {
            conversation.endSession();
            finish();
          }}
        >
          ⏹️ Finish
        </Button>
      </div>
    </div>
  );
}

export function CorrectionCard({ c }: { c: Correction }) {
  return (
    <div className="rounded-3xl border border-warn bg-warn-soft p-4 text-sm" role="status">
      <p className="flex flex-wrap items-center gap-2 font-bold text-warn">
        ✏️ Better here {c.register && <RegisterTag register={c.register} />}
      </p>
      <p className="mt-1">
        <span className="line-through opacity-70">«{c.said}»</span> → <span className="font-bold">«{c.better}»</span>
      </p>
    </div>
  );
}
