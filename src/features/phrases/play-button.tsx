"use client";
/**
 * 🔊 button that reads a phrase (or its example) aloud. Owner: T7.
 * 1. Asks our server for ElevenLabs audio (POST /api/tts; the key stays on the server).
 * 2. If that isn't set up or fails, uses the browser's own Norwegian voice, so the button always works in the demo.
 */
import { useEffect, useRef, useState } from "react";

type Part = "text" | "example";
type State = "idle" | "loading" | "playing";

// Audio we already fetched this session (blob URLs), so replaying is instant and free.
const audioUrls = new Map<string, string>();
// Once the server says TTS isn't configured, stop asking it.
let serverTtsAvailable = true;

function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return reject(new Error("no speech"));
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\([^)]*\)/g, ""));
    u.lang = "nb-NO";
    const voice = window.speechSynthesis.getVoices().find((v) => /^(nb|no|nn)(-|_|$)/i.test(v.lang));
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = () => resolve();
    u.onerror = () => reject(new Error("speech failed"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

async function serverAudioUrl(phraseId: string, part: Part): Promise<string | null> {
  const key = `${phraseId}:${part}`;
  const cached = audioUrls.get(key);
  if (cached) return cached;
  if (!serverTtsAvailable) return null;
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phraseId, part }),
  });
  if (res.status === 503) serverTtsAvailable = false;
  if (!res.ok || !res.headers.get("content-type")?.startsWith("audio/")) return null;
  const url = URL.createObjectURL(await res.blob());
  audioUrls.set(key, url);
  return url;
}

export function PlayButton({
  phraseId,
  text,
  part = "text",
  label,
  size = "md",
}: {
  phraseId: string;
  /** Norwegian text, used for the browser-voice fallback. */
  text: string;
  part?: Part;
  /** Accessible label, e.g. "Play «Digg!»". */
  label: string;
  size?: "sm" | "md";
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  async function play() {
    if (state !== "idle") {
      audioRef.current?.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      setState("idle");
      return;
    }
    setError(false);
    setState("loading");
    try {
      const url = await serverAudioUrl(phraseId, part).catch(() => null);
      if (url) {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setState("idle");
        audio.onerror = () => setState("idle");
        setState("playing");
        await audio.play();
      } else {
        setState("playing");
        await speakWithBrowser(text);
        setState("idle");
      }
    } catch {
      setState("idle");
      setError(true);
    }
  }

  const dims = size === "sm" ? "h-11 w-11 text-base" : "h-12 w-12 text-xl";
  return (
    <button
      type="button"
      onClick={play}
      aria-label={state === "idle" ? label : "Stop audio"}
      title={error ? "Audio isn't available on this device" : label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-surface transition hover:bg-surface-2 active:scale-95 ${dims} ${state === "playing" ? "border-brand bg-brand-soft" : ""}`}
    >
      <span aria-hidden className={state === "loading" ? "animate-pulse" : ""}>
        {error ? "🔇" : state === "playing" ? "⏹️" : "🔊"}
      </span>
    </button>
  );
}
