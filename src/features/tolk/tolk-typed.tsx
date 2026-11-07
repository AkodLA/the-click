"use client";
/**
 * Tolk, typing mode (T19): each person types in their own language, the browser's on-device Translator
 * (Opera Web AI / Chrome) translates it and reads it aloud. No voice agent, no server, nothing leaves the device.
 * Uses the same table layout and summary as voice Tolk.
 */
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { detectLanguage, translateText } from "@/lib/web-ai/translator";
import type { TolkLanguage, TolkTurn } from "./tolk-data";
import { TolkTable } from "./tolk-table";

/** Browser voice for reading the translation aloud (best effort). */
const VOICE_LANG: Record<string, string> = { nb: "nb-NO", en: "en-GB", uk: "uk-UA", ar: "ar-SA", pl: "pl-PL", es: "es-ES", fr: "fr-FR", tr: "tr-TR", ur: "ur-PK", fa: "fa-IR", so: "so-SO", ti: "ti-ER" };

function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE_LANG[lang] ?? lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function TolkTyped({ langA, langB, onEnd }: { langA: TolkLanguage; langB: TolkLanguage; onEnd: (turns: TolkTurn[]) => void }) {
  const [turns, setTurns] = useState<TolkTurn[]>([]);
  const [speaker, setSpeaker] = useState<"a" | "b">("a");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<{ text: string; tone: "idle" | "listening" | "speaking" | "error" }>({ text: "Type a message", tone: "listening" });
  const [readAloud, setReadAloud] = useState(true);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim().slice(0, 500);
    if (!text || busy) return;
    setBusy(true);
    // If the browser can detect the language, it picks the speaker for you.
    const detected = await detectLanguage(text, [langA.code, langB.code]);
    const who: "a" | "b" = detected === langA.code ? "a" : detected === langB.code ? "b" : speaker;
    const from = who === "a" ? langA : langB;
    const to = who === "a" ? langB : langA;
    setStatus({ text: "Translating…", tone: "speaking" });
    const r = await translateText(text, from.code, to.code, (loaded) =>
      setStatus({ text: `Getting the translator… ${Math.round(loaded * 100)}%`, tone: "idle" }),
    );
    setBusy(false);
    if (!r.ok) {
      setStatus({ text: r.message, tone: "error" });
      return;
    }
    setTurns((t) => [...t, { id: ++seq.current, speaker: who, original: text, translation: r.text }]);
    setDraft("");
    setSpeaker(who === "a" ? "b" : "a"); // it's usually the other person's turn next
    setStatus({ text: "Type a message", tone: "listening" });
    if (readAloud) speak(r.text, to.code);
  }

  const current = speaker === "a" ? langA : langB;

  return (
    <TolkTable
      langA={langA}
      langB={langB}
      turns={turns}
      status={status}
      banner={
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs font-semibold text-muted">
            ⌨️ Typing mode · translated on this device ·{" "}
            <button type="button" className="underline" onClick={() => setReadAloud((x) => !x)}>
              {readAloud ? "🔊 read aloud" : "🔇 silent"}
            </button>
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="radiogroup" aria-label="Who is typing">
            {(["a", "b"] as const).map((s) => {
              const l = s === "a" ? langA : langB;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={speaker === s}
                  onClick={() => setSpeaker(s)}
                  className={`h-11 rounded-xl text-sm font-bold transition ${speaker === s ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
                >
                  {s === "a" ? "🙂 Me" : "🧑 Them"} · {l.native}
                </button>
              );
            })}
          </div>
          <form onSubmit={send} className="flex items-center gap-2">
            <label htmlFor="tolk-type" className="sr-only">
              Message in {current.name}
            </label>
            <input
              id="tolk-type"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              autoComplete="off"
              dir="auto"
              lang={current.code}
              placeholder={`Type in ${current.name}…`}
              className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-base focus:border-brand focus:outline-none"
            />
            <Button type="submit" disabled={!draft.trim() || busy} aria-label="Translate">
              ➤
            </Button>
          </form>
        </div>
      }
      controls={
        <Button variant="accent" onClick={() => { window.speechSynthesis?.cancel(); onEnd(turns); }}>
          ⏹️ End
        </Button>
      }
    />
  );
}
