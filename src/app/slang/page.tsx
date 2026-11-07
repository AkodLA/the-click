"use client";
import { useState } from "react";
import { AppShell, RegisterChip } from "@/components/AppShell";
import { PHRASES, REGISTER, SITUATIONS, type Phrase, type Situation } from "@/lib/content";
import { addCard, addXp, unlock, update, useProgress } from "@/lib/progress";

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/[«»…]/g, ""));
    u.lang = "nb-NO";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* no browser voice */
  }
}

function verdict(ph: Phrase, s: Situation): "ok" | "no" | "maybe" {
  if (ph.ok.includes(s)) return "ok";
  if (ph.no.includes(s)) return "no";
  return "maybe";
}

export default function SlangPage() {
  const p = useProgress();
  const [who, setWho] = useState<Situation>("sjef");

  function learned(ph: Phrase) {
    if (p.seenPhrases.includes(ph.id)) return;
    update((s) => ({ ...s, seenPhrases: [...s.seenPhrases, ph.id] }));
    addCard({ no: ph.say, home: ph.means, source: "slang" });
    addXp(20, ph.say);
    if (p.seenPhrases.length + 1 >= 5) unlock("registersans", "Registersans");
  }

  return (
    <AppShell title="Slang-sjekk">
      <p className="text-ink-soft">Samme setning kan være perfekt med venner og pinlig hos sjefen.</p>

      <fieldset className="mt-5">
        <legend className="font-bold">Hvem snakker du med?</legend>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {SITUATIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setWho(s.id)}
              aria-pressed={who === s.id}
              className={`shrink-0 rounded-full px-4 py-2 font-bold ${who === s.id ? "bg-ink text-white" : "bg-sheet"}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Register legend: the app's colour system, explained once */}
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-soft">
        {(Object.keys(REGISTER) as (keyof typeof REGISTER)[]).map((r) => (
          <li key={r} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${REGISTER[r].dot}`} />
            <span>
              <b className="text-ink">{REGISTER[r].label}</b>: {REGISTER[r].who}
            </span>
          </li>
        ))}
      </ul>

      <ul className="mt-6 space-y-4">
        {PHRASES.map((ph) => {
          const v = verdict(ph, who);
          const seen = p.seenPhrases.includes(ph.id);
          return (
            <li key={ph.id} className="overflow-hidden rounded-3xl bg-sheet">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="display text-2xl font-bold">{ph.say}</p>
                    <p className="text-ink-soft">{ph.means}</p>
                  </div>
                  <button
                    onClick={() => speak(ph.say)}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-frost text-lg"
                    aria-label={`Hør «${ph.say}»`}
                  >
                    🔊
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <RegisterChip r={ph.register} />
                  <span className="text-xs font-bold text-ink-soft">{ph.level}</span>
                </div>
                <p className="mt-3 italic text-ink-soft">«{ph.example}»</p>
                {ph.note && <p className="mt-2 text-sm">{ph.note}</p>}
              </div>

              <div
                className={`flex items-start gap-3 px-5 py-4 ${
                  v === "ok" ? "bg-gran-soft" : v === "no" ? "bg-tytte-soft" : "bg-frost"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {v === "ok" ? "✅" : v === "no" ? "🚫" : "🤔"}
                </span>
                <div className="flex-1">
                  <p className="font-bold">
                    {v === "ok" ? "Passer her." : v === "no" ? "Ikke her." : "Kommer an på personen."}
                  </p>
                  {v !== "ok" && (
                    <p>
                      Si heller: <b>{ph.instead}</b>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => learned(ph)}
                  disabled={seen}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${seen ? "text-ink-soft" : "bg-ink text-white"}`}
                >
                  {seen ? "Lært ✓" : "Lært"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
