"use client";
/**
 * T23: record what the learner says in English (max 15 s) and get it back as text.
 * - Server listening (ElevenLabs speech-to-text via POST /api/say/transcribe) when the server has it.
 * - Otherwise the browser's own speech recognition, if there is one (Chrome/Safari may send audio to Google/Apple:
 *   the screen says so before you start).
 * - Otherwise: typing only.
 */
import { useEffect, useRef, useState } from "react";

export type ListenMode = "server" | "browser" | "none";
export type RecState = { kind: "idle" } | { kind: "recording"; seconds: number } | { kind: "working" } | { kind: "error"; message: string };

const MAX_SECONDS = 15;

// Minimal typing for the Web Speech API (not in TypeScript's DOM lib everywhere).
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecCtor = new () => SpeechRec;

function speechRecCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function pickListenMode(serverCanListen: boolean): ListenMode {
  if (typeof window === "undefined") return "none";
  if (serverCanListen && typeof MediaRecorder !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") return "server";
  return speechRecCtor() ? "browser" : "none";
}

function pickMime(): string {
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
}

export function useEnglishRecorder(mode: ListenMode, onText: (text: string) => void) {
  const [state, setState] = useState<RecState>({ kind: "idle" });
  const rec = useRef<MediaRecorder | null>(null);
  const speech = useRef<SpeechRec | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useRef<MediaStream | null>(null);

  function cleanup() {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }

  // Leaving the page stops the mic.
  useEffect(
    () => () => {
      cleanup();
      try {
        if (rec.current?.state === "recording") rec.current.stop();
        speech.current?.stop();
      } catch {}
    },
    [],
  );

  function startTimer(stop: () => void) {
    let s = 0;
    setState({ kind: "recording", seconds: 0 });
    tick.current = setInterval(() => {
      s += 1;
      if (s >= MAX_SECONDS) stop();
      else setState({ kind: "recording", seconds: s });
    }, 1000);
  }

  async function start() {
    if (mode === "browser") return startBrowser();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState({ kind: "error", message: "Snakk needs the microphone for this. Allow it in your browser settings, or type instead." });
      return;
    }
    const mime = pickMime();
    const r = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      cleanup();
      setState({ kind: "working" });
      const blob = new Blob(chunks, { type: (r.mimeType || mime || "audio/webm").split(";")[0] });
      const form = new FormData();
      form.append("audio", blob, "speech");
      try {
        const res = await fetch("/api/say/transcribe", { method: "POST", body: form });
        const json = (await res.json()) as { ok: boolean; data?: { text: string }; error?: { message: string } };
        if (!json.ok || !json.data) throw new Error(json.error?.message ?? "Couldn't understand the recording.");
        setState({ kind: "idle" });
        onText(json.data.text);
      } catch (err) {
        setState({ kind: "error", message: err instanceof Error ? err.message : "Couldn't understand the recording." });
      }
    };
    rec.current = r;
    r.start();
    startTimer(() => r.state === "recording" && r.stop());
  }

  function startBrowser() {
    const Ctor = speechRecCtor();
    if (!Ctor) return;
    const s = new Ctor();
    s.lang = "en-US";
    s.interimResults = false;
    s.maxAlternatives = 1;
    let heard = "";
    s.onresult = (e) => {
      heard = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ").trim();
    };
    s.onerror = (e) => {
      cleanup();
      setState({
        kind: "error",
        message: e.error === "not-allowed" ? "Snakk needs the microphone for this. Allow it, or type instead." : "We didn't catch that. Try again, or type it.",
      });
    };
    s.onend = () => {
      cleanup();
      setState((st) => (st.kind === "error" ? st : { kind: "idle" }));
      if (heard) onText(heard.slice(0, 500));
    };
    speech.current = s;
    s.start();
    startTimer(() => s.stop());
  }

  function stop() {
    if (rec.current?.state === "recording") rec.current.stop();
    else speech.current?.stop();
    if (tick.current) clearInterval(tick.current);
  }

  return { state, start, stop, reset: () => setState({ kind: "idle" }) };
}
