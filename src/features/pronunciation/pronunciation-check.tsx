"use client";
/**
 * Pronunciation check (T5): say a Norwegian sentence → the server transcribes it with ElevenLabs
 * and returns which words it heard (green ✓ / red ✗), a score and a tip. XP is decided by the server.
 *
 *   <PronunciationCheck sentence="Pizzaen var skikkelig digg." target="digg" />
 *
 * `target` is what the server checks against: a phrase id (its example), "phrase:<id>" (the phrase
 * itself) or the exact text of a sentence from src/lib/content. Owner: T5.
 */
import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import type { ApiResponse } from "@/lib/api";
import type { PronunciationResult } from "@/lib/content/types";
import { progressActions, type EventResult } from "@/lib/progress/store";
import { speakNorwegian } from "@/lib/speech";

const MAX_SECONDS = 15;
const MIN_MS = 600;

/** Event-handler clock (kept outside the component so the React purity lint knows it never runs in render). */
const now = () => Date.now();

type Status =
  | { kind: "idle" }
  | { kind: "asking" }
  | { kind: "recording"; startedAt: number }
  | { kind: "checking" }
  | { kind: "done"; result: PronunciationResult }
  | { kind: "error"; message: string };

interface PronunciationResponse extends EventResult {
  result: PronunciationResult;
}

/** Safari records mp4/aac, Chrome/Firefox webm/opus. Pick the first one this browser supports. */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

const ERROR_TEXT: Record<string, string> = {
  rate_limited: "That was a lot of tries! Wait a minute and go again.",
  too_large: "That recording was too long. Keep it under 15 seconds.",
  not_configured: "Pronunciation check isn't switched on yet on this server.",
  stt_failed: "We couldn't check that one. Try again.",
  unknown_target: "This sentence can't be checked.",
};

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
    return "Microphone is blocked. Allow it in your browser settings (the 🔒 next to the address), then try again.";
  }
  if (err instanceof DOMException && err.name === "NotFoundError") return "No microphone found on this device.";
  const code = msg.split(":")[0];
  return ERROR_TEXT[code] ?? "Something went wrong. Check your connection and try again.";
}

async function upload(audio: Blob, target: string, token: string | null): Promise<PronunciationResponse> {
  const form = new FormData();
  form.append("audio", audio, "speech");
  form.append("target", target);
  if (token) form.append("token", token);
  const res = await fetch("/api/pronunciation", { method: "POST", body: form });
  let body: ApiResponse<PronunciationResponse>;
  try {
    body = (await res.json()) as ApiResponse<PronunciationResponse>;
  } catch {
    throw new Error(`http_${res.status}: Unexpected response`);
  }
  if (!body.ok) throw new Error(`${body.error.code}: ${body.error.message}`);
  return body.data;
}

function scoreTone(score: number): "success" | "warn" | "danger" {
  return score >= 80 ? "success" : score >= 60 ? "warn" : "danger";
}

export function PronunciationCheck({ sentence, target, label = "Say it out loud" }: { sentence: string; target: string; label?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cancelled = useRef(false);

  const stopTracks = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  // Release the mic if the learner leaves the screen mid-recording.
  useEffect(
    () => () => {
      cancelled.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stopTracks();
    },
    [],
  );

  // Timer + hard stop at 15 s.
  useEffect(() => {
    if (status.kind !== "recording") return;
    const id = window.setInterval(() => {
      const s = (now() - status.startedAt) / 1000;
      setElapsed(s);
      if (s >= MAX_SECONDS) recorder.current?.stop();
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus({ kind: "error", message: "This browser can't record audio. Try Chrome or Safari on your phone." });
      return;
    }
    setStatus({ kind: "asking" });
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(s, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined);
      chunks.current = [];
      const startedAt = now();
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stopTracks();
        if (cancelled.current) return;
        if (now() - startedAt < MIN_MS) {
          setStatus({ kind: "error", message: "That was very short. Tap, say the whole sentence, then tap stop." });
          return;
        }
        const audio = new Blob(chunks.current, { type: (rec.mimeType || mimeType || "audio/webm").split(";")[0] });
        void check(audio);
      };
      recorder.current = rec;
      rec.start();
      setElapsed(0);
      setStatus({ kind: "recording", startedAt });
    } catch (err) {
      stopTracks();
      setStatus({ kind: "error", message: friendlyError(err) });
    }
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function check(audio: Blob) {
    setStatus({ kind: "checking" });
    try {
      const data = await progressActions.run((token) => upload(audio, target, token));
      setStatus({ kind: "done", result: data.result });
    } catch (err) {
      setStatus({ kind: "error", message: friendlyError(err) });
    }
  }

  function listen() {
    speakNorwegian(sentence);
  }

  const recording = status.kind === "recording";
  const busy = status.kind === "asking" || status.kind === "checking";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">🎤 {label}</p>
        <button
          type="button"
          onClick={listen}
          className="h-11 rounded-xl px-3 text-sm font-semibold text-brand hover:bg-brand-soft"
          aria-label={`Hear «${sentence}»`}
        >
          🔊 Hear it
        </button>
      </div>

      {status.kind === "done" ? (
        <p className="text-xl font-bold leading-relaxed" aria-label="Your result, word by word">
          {status.result.words.map((w, i) => (
            <span
              key={`${w.word}-${i}`}
              className={`mr-1.5 inline-block rounded-lg px-1.5 ${w.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger underline decoration-wavy"}`}
            >
              {w.word}
              <span className="sr-only">{w.ok ? " (heard)" : " (missed)"}</span>
            </span>
          ))}
        </p>
      ) : (
        <p className="text-xl font-bold">«{sentence}»</p>
      )}

      {status.kind === "done" && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center gap-2">
            <Badge tone={scoreTone(status.result.score)} className="text-sm">
              {status.result.score >= 80 ? "🎯" : status.result.score >= 60 ? "👍" : "🔁"} {status.result.score}/100
            </Badge>
            <span className="text-sm text-muted">
              We heard: «{status.result.heard || "…"}»
            </span>
          </div>
          {status.result.tip && <p className="rounded-xl bg-brand-soft p-3 text-sm">💡 {status.result.tip}</p>}
        </div>
      )}

      {status.kind === "error" && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
          ⚠️ {status.message}
        </p>
      )}

      {recording ? (
        <Button variant="accent" onClick={stop} aria-label="Stop recording">
          <span className="motion-safe:animate-pulse" aria-hidden>
            ⏺
          </span>
          Stop · {Math.max(0, MAX_SECONDS - Math.floor(elapsed))}s left
        </Button>
      ) : (
        <Button variant={status.kind === "done" ? "secondary" : "primary"} onClick={start} disabled={busy}>
          {status.kind === "asking"
            ? "Allow the microphone…"
            : status.kind === "checking"
              ? "Listening to you…"
              : status.kind === "done" || status.kind === "error"
                ? "🔁 Try again"
                : "🎙️ Tap and speak"}
        </Button>
      )}
    </div>
  );
}
