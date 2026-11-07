"use client";
/**
 * Tolk (/tolk): a two-way interpreter for real meetings. Owner: T8.
 *   setup → live (ElevenLabs agent) or demo (offline sample) → summary ("learn from this meeting")
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useProgress } from "@/lib/progress/store";
import { DEMO_TURNS, TOLK_LANGUAGES, TOLK_SETTINGS, tolkLanguage, tolkSetting, type TolkTurn } from "./tolk-data";
import { TolkSummary } from "./tolk-summary";
import { TolkTable } from "./tolk-table";
import { TolkTyped } from "./tolk-typed";
import { HOW_TO_ENABLE, translationAvailability, translatorSupported } from "@/lib/web-ai/translator";

// The voice SDK is only loaded when a live session starts.
const TolkLive = dynamic(() => import("./tolk-live").then((m) => m.TolkLive), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg text-lg font-semibold text-muted">Starting Tolk…</div>
  ),
});

type Stage = "setup" | "live" | "demo" | "typed" | "summary";

export function TolkView() {
  const p = useProgress();
  const [stage, setStage] = useState<Stage>("setup");
  const [langACode, setLangACode] = useState<string | null>(null);
  const [langBCode, setLangBCode] = useState("nb");
  const [settingId, setSettingId] = useState(TOLK_SETTINGS[0].id);
  const [turns, setTurns] = useState<TolkTurn[]>([]);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [wasDemo, setWasDemo] = useState(false);
  const [checkingTyped, setCheckingTyped] = useState(false);

  // Default "my language" = the learner's native language from their profile (if Tolk supports it).
  const defaultA = TOLK_LANGUAGES.some((l) => l.code === p.nativeLanguage) && p.nativeLanguage !== "nb" ? p.nativeLanguage : "en";
  const langA = tolkLanguage(langACode ?? defaultA);
  const langB = tolkLanguage(langBCode);
  const setting = tolkSetting(settingId);
  const sameLanguage = langA.code === langB.code;

  /** T19: only open typing mode if this browser can really translate the pair on the device. */
  async function startTyped() {
    setError(null);
    if (!translatorSupported()) {
      setError({ message: HOW_TO_ENABLE, code: "web_ai_missing" });
      return;
    }
    setCheckingTyped(true);
    const a = await translationAvailability(langA.code, langB.code);
    setCheckingTyped(false);
    if (a === "unsupported" || a === "unavailable") {
      setError({ message: `This browser can't translate ${langA.name} ↔ ${langB.name} on the device right now. ${HOW_TO_ENABLE}`, code: "web_ai_missing" });
    } else setStage("typed");
  }

  function swap() {
    setLangACode(langB.code);
    setLangBCode(langA.code);
  }

  function finish(result: TolkTurn[], demo: boolean) {
    setTurns(result);
    setWasDemo(demo);
    setStage("summary");
    window.scrollTo({ top: 0 });
  }

  if (stage === "live") {
    return (
      <TolkLive
        langA={langA}
        langB={langB}
        setting={setting}
        onEnd={(t) => finish(t, false)}
        onFail={(message, code) => {
          setError({ message, code });
          setStage("setup");
        }}
      />
    );
  }

  if (stage === "typed") {
    return <TolkTyped langA={langA} langB={langB} onEnd={(t) => finish(t, false)} />;
  }

  if (stage === "demo") {
    return <TolkDemo onEnd={(t) => finish(t, true)} />;
  }

  if (stage === "summary") {
    return (
      <TolkSummary
        turns={turns}
        langA={wasDemo ? tolkLanguage("en") : langA}
        langB={wasDemo ? tolkLanguage("nb") : langB}
        setting={wasDemo ? tolkSetting("school") : setting}
        isDemo={wasDemo}
        onRestart={() => {
          setTurns([]);
          setStage("setup");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Tolk · interpreter</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Put the phone on the table. Talk.</h1>
        <p className="mt-2 text-sm opacity-90">
          Tolk interprets both ways, out loud, in the everyday moments: at pickup, at the shop, with the neighbours. So your kids don&apos;t have to.
        </p>
      </section>

      {error && (
        <Card className="flex flex-col gap-3 border-danger bg-danger-soft" role="alert">
          <p className="font-bold text-danger">⚠️ {error.message}</p>
          <div className="flex flex-wrap gap-2">
            {error.code !== "mic_denied" && (
              <Button variant="secondary" onClick={() => { setError(null); setStage("demo"); }}>
                ▶️ Watch the demo instead
              </Button>
            )}
            {error.code === "web_ai_missing" ? (
              <Button onClick={() => { setError(null); setStage("live"); }}>🎙️ Use voice Tolk</Button>
            ) : (
              error.code !== "not_configured" && <Button onClick={() => { setError(null); setStage("live"); }}>Try again</Button>
            )}
            {error.code === "not_configured" && translatorSupported() && (
              <Button onClick={startTyped}>⌨️ Type instead (on-device)</Button>
            )}
          </div>
        </Card>
      )}

      <section>
        <SectionTitle>Who is talking?</SectionTitle>
        <Card className="flex flex-col gap-3">
          <LanguageSelect id="lang-a" label="You speak" value={langA.code} onChange={setLangACode} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swap}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold transition hover:bg-surface-2"
              aria-label="Swap languages"
            >
              <span aria-hidden>⇅</span> Swap
            </button>
          </div>
          <LanguageSelect id="lang-b" label="The other person speaks" value={langB.code} onChange={setLangBCode} />
          {sameLanguage && <p className="text-sm font-semibold text-danger">Pick two different languages.</p>}
        </Card>
      </section>

      <section>
        <SectionTitle>Where are you?</SectionTitle>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Setting">
          {TOLK_SETTINGS.map((s) => {
            const active = s.id === settingId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSettingId(s.id)}
                className={`flex min-h-11 items-center gap-2 rounded-3xl border p-4 text-left font-semibold transition ${
                  active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <span className="leading-tight">{s.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button size="lg" disabled={sameLanguage} onClick={() => { setError(null); setStage("live"); }}>
          🎙️ Start interpreting
        </Button>
        <Button variant="secondary" disabled={sameLanguage || checkingTyped} onClick={startTyped}>
          {checkingTyped ? "Checking your browser…" : "⌨️ Type instead (on-device, private)"}
        </Button>
        <Link href="/translator" className="-mt-1 flex h-11 items-center justify-center text-sm font-semibold text-brand">
          🌐 Check this browser&apos;s translator
        </Link>
        <Button variant="secondary" onClick={() => { setError(null); setStage("demo"); }}>
          ▶️ Watch a demo
        </Button>
      </div>

      <Card className="flex flex-col gap-2 text-sm">
        <p className="font-bold">How it works</p>
        <ol className="list-inside list-decimal space-y-1 text-muted">
          <li>Lay the phone flat between you. The top half faces the other person.</li>
          <li>Take turns. Say a sentence or two, then pause.</li>
          <li>Tolk says the translation out loud and shows it on both sides.</li>
        </ol>
      </Card>

      <Card className="flex flex-col gap-2 bg-surface-2 text-sm">
        <p className="font-bold">⚖️ Good to know</p>
        <p className="text-muted">
          Tolk is a communication aid, <strong>not a certified interpreter</strong>. For legal, medical or child-welfare decisions you have the right to a
          qualified interpreter: ask the school, doctor or NAV to book one (Nasjonalt tolkeregister, tolkeportalen.no).
        </p>
        <p className="text-muted">
          🔒 Audio is processed live by our voice partner (ElevenLabs) to interpret it. Snakk doesn&apos;t save the conversation. Everyone at the table
          should know Tolk is listening.
        </p>
      </Card>
    </div>
  );
}

function LanguageSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (code: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base font-semibold focus:border-brand focus:outline-none"
      >
        {TOLK_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name === l.native ? l.name : `${l.name} · ${l.native}`}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Offline demo: plays the sample chat with a teacher at pickup, reading each translation aloud with the browser voice. */
function TolkDemo({ onEnd }: { onEnd: (turns: TolkTurn[]) => void }) {
  const [shown, setShown] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const [paused, setPaused] = useState(false);
  const turns: TolkTurn[] = DEMO_TURNS.slice(0, shown).map((t, i) => ({ ...t, id: i + 1 }));
  const done = shown >= DEMO_TURNS.length;

  useEffect(() => {
    if (paused || done) return;
    const t = setTimeout(() => {
      const next = DEMO_TURNS[shown];
      setShown((n) => n + 1);
      if (readAloud && typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(next.translation);
        u.lang = next.speaker === "a" ? "nb-NO" : "en-GB";
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    }, shown === 0 ? 800 : 4200);
    return () => clearTimeout(t);
  }, [shown, paused, done, readAloud]);

  useEffect(() => () => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  function end() {
    window.speechSynthesis?.cancel();
    onEnd(turns);
  }

  return (
    <TolkTable
      langA={tolkLanguage("en")}
      langB={tolkLanguage("nb")}
      turns={turns}
      status={
        done
          ? { text: "Demo finished", tone: "idle" }
          : paused
            ? { text: "Paused", tone: "idle" }
            : speaking
              ? { text: "Interpreting…", tone: "speaking" }
              : { text: "Listening…", tone: "listening" }
      }
      banner={
        <p className="text-center text-xs font-semibold text-muted">
          Demo: sample conversation (English ↔ Norsk) ·{" "}
          <button type="button" className="underline" onClick={() => { setReadAloud((r) => !r); window.speechSynthesis?.cancel(); }}>
            {readAloud ? "🔊 sound on" : "🔇 sound off"}
          </button>
        </p>
      }
      controls={
        <>
          {!done && (
            <Button variant="secondary" onClick={() => setPaused((x) => !x)} aria-pressed={paused}>
              {paused ? "▶️ Resume" : "⏸️ Pause"}
            </Button>
          )}
          <Button variant="accent" onClick={end}>
            {done ? "✅ See summary" : "⏹️ End"}
          </Button>
        </>
      }
    />
  );
}
