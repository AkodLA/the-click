"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LEARNER_LANGUAGES, LEVELS, LEVEL_TEXT, PLACEMENT, levelFromScore, type Level } from "@/lib/content";
import { addXp, unlock, update, useProgress } from "@/lib/progress";

const NICKS = ["Fjellrev", "Måke", "Nordlys", "Brunost", "Trikk", "Lunde", "Elg", "Kvikk"];

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "nb-NO";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* no TTS in this browser: the text fallback below still works */
  }
}

export default function StartPage() {
  const router = useRouter();
  const p = useProgress();
  const [step, setStep] = useState<"hei" | "deg" | "test" | "resultat">("hei");
  const [nick, setNick] = useState(() => NICKS[Math.floor(Math.random() * NICKS.length)]);
  const [lang, setLang] = useState(p.homeLang || "so");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);

  const level: Level = useMemo(() => levelFromScore(answers), [answers]);
  const item = PLACEMENT[i];

  function choose(n: number) {
    if (picked !== null) return;
    setPicked(n);
    setTimeout(() => {
      const next = [...answers, n === item.answer];
      setAnswers(next);
      setPicked(null);
      setShowText(false);
      // Stop early once the learner misses two in a row: no need to grind through C2 questions.
      const lastTwoWrong = next.length >= 2 && !next[next.length - 1] && !next[next.length - 2];
      if (i + 1 >= PLACEMENT.length || lastTwoWrong) setStep("resultat");
      else setI(i + 1);
    }, 550);
  }

  function finish() {
    update((s) => ({ ...s, nick, homeLang: lang, level }));
    addXp(100, "nivåtest");
    unlock("forste-ord", "Første ord");
    router.push("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      {step === "hei" && (
        <section className="flex flex-1 flex-col justify-between gap-10">
          <span className="display text-3xl font-extrabold text-gran">prat</span>
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.02]">
              Norsk som det faktisk snakkes.
            </h1>
            <p className="mt-5 max-w-[34ch] text-lg text-ink-soft">
              Ikke læreboknorsk. Det folk sier i lunsjen, på bussen og hos legen, og når du ikke bør si det.
            </p>
          </div>
          <div className="space-y-3">
            <button onClick={() => setStep("deg")} className="w-full rounded-2xl bg-gran py-4 text-lg font-bold text-white">
              Finn nivået mitt
            </button>
            <p className="text-center text-sm text-ink-soft">Tar to minutter. Ingen konto, ingen e-post.</p>
          </div>
        </section>
      )}

      {step === "deg" && (
        <section className="flex flex-1 flex-col gap-8">
          <h1 className="text-3xl font-extrabold">Hvem er du her?</h1>
          <div>
            <label htmlFor="nick" className="font-bold">
              Kallenavn
            </label>
            <p className="text-sm text-ink-soft">Andre ser bare dette. Aldri navnet eller ansiktet ditt.</p>
            <div className="mt-3 flex gap-2">
              <input
                id="nick"
                value={nick}
                onChange={(e) => setNick(e.target.value.slice(0, 20))}
                className="flex-1 rounded-2xl border-2 border-line bg-sheet px-4 py-3 text-lg font-bold"
              />
              <button
                onClick={() => setNick(NICKS[Math.floor(Math.random() * NICKS.length)])}
                className="rounded-2xl bg-sheet px-4 text-xl"
                aria-label="Nytt tilfeldig kallenavn"
              >
                🎲
              </button>
            </div>
          </div>
          <div>
            <p className="font-bold">Språket du kan best</p>
            <p className="text-sm text-ink-soft">Forklaringer og tolking kommer på dette språket.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LEARNER_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold ${
                    lang === l.code ? "border-gran bg-gran-soft" : "border-transparent bg-sheet"
                  }`}
                >
                  {l.flag} {l.native}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!nick.trim()}
            onClick={() => setStep("test")}
            className="mt-auto w-full rounded-2xl bg-gran py-4 text-lg font-bold text-white disabled:opacity-40"
          >
            Start nivåtesten
          </button>
        </section>
      )}

      {step === "test" && item && (
        <section className="flex flex-1 flex-col gap-6">
          <div className="flex gap-1" aria-label={`Spørsmål ${i + 1} av ${PLACEMENT.length}`}>
            {PLACEMENT.map((_, n) => (
              <span key={n} className={`h-2 flex-1 rounded-full ${n < i ? "bg-gran" : n === i ? "bg-sol" : "bg-line"}`} />
            ))}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">{item.prompt}</h1>

          {item.audio && (
            <div className="rounded-3xl bg-sheet p-5">
              <button
                onClick={() => speak(item.audio!)}
                className="flex w-full items-center gap-4 text-left text-lg font-bold"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-gran text-2xl text-white">▶</span>
                Spill av
              </button>
              <button onClick={() => setShowText((v) => !v)} className="mt-3 text-sm font-bold text-ink-soft underline">
                {showText ? item.audio : "Får du ikke lyd? Vis teksten"}
              </button>
            </div>
          )}

          <div className="grid gap-3">
            {item.options.map((o, n) => {
              const state =
                picked === null ? "bg-sheet" : n === item.answer ? "bg-gran-soft border-gran" : n === picked ? "bg-tytte-soft border-tytte" : "bg-sheet opacity-60";
              return (
                <button
                  key={o}
                  onClick={() => choose(n)}
                  className={`rounded-2xl border-2 border-transparent px-5 py-4 text-left text-lg font-bold ${state}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          <button onClick={() => choose(-1)} className="mt-auto text-center font-bold text-ink-soft">
            Vet ikke
          </button>
        </section>
      )}

      {step === "resultat" && (
        <section className="flex flex-1 flex-col gap-8">
          <p className="text-lg font-bold text-ink-soft">Ditt nivå</p>
          <div>
            <p className="display text-[7rem] font-extrabold leading-none text-gran">{level}</p>
            <p className="mt-3 text-xl">{LEVEL_TEXT[level]}</p>
          </div>
          <ol className="flex gap-1" aria-label="Alle nivåer">
            {LEVELS.map((l) => (
              <li
                key={l}
                className={`flex-1 rounded-xl py-2 text-center text-sm font-bold ${
                  l === level ? "bg-gran text-white" : LEVELS.indexOf(l) < LEVELS.indexOf(level) ? "bg-gran-soft text-gran-deep" : "bg-sheet text-ink-soft"
                }`}
              >
                {l}
              </li>
            ))}
          </ol>
          <p className="text-ink-soft">
            Testen sjekker forståelse og register. Første samtale med læreren justerer nivået etter hvordan du snakker.
          </p>
          <button onClick={finish} className="mt-auto w-full rounded-2xl bg-gran py-4 text-lg font-bold text-white">
            Ferdig, til appen
          </button>
        </section>
      )}
    </div>
  );
}
