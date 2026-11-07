"use client";
import Link from "next/link";
import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { AppShell, RegisterChip } from "@/components/AppShell";
import { VoiceOrb, type OrbState } from "@/components/VoiceOrb";
import { LEARNER_LANGUAGES, SCENARIOS, type Register, type Scenario } from "@/lib/content";
import { addCard, addXp, unlock, update, useProgress, type Progress } from "@/lib/progress";

export default function SnakkPage() {
  return (
    <Suspense>
      <Snakk />
    </Suspense>
  );
}

function Snakk() {
  const params = useSearchParams();
  const p = useProgress();
  const practiceTolk = params.get("ov") === "tolk";
  const picked = SCENARIOS.find((s) => s.id === params.get("s"));

  // "Practise your interpreted phrases" is a scenario built from the learner's own deck.
  const tolkCards = p.deck.filter((c) => c.source === "tolk");
  const tolkScenario: Scenario | null =
    practiceTolk && tolkCards.length
      ? {
          id: "fra-tolk",
          title: "Si det selv neste gang",
          icon: "🗣",
          level: p.level ?? "A2",
          register: "formell",
          role: "Den samme personen du snakket med via tolken",
          goal: "Si setningene du trengte tolk til, med egen stemme",
          targets: tolkCards.slice(0, 5).map((c) => c.no),
        }
      : null;

  const scenario = tolkScenario ?? picked;

  if (!scenario) {
    return (
      <AppShell title="Snakk">
        <p className="text-ink-soft">Velg en situasjon. Læreren spiller den andre personen og retter deg underveis.</p>
        <ul className="mt-5 space-y-3">
          {SCENARIOS.map((s) => (
            <li key={s.id}>
              <Link href={`/snakk?s=${s.id}`} className="flex items-center gap-4 rounded-3xl bg-sheet p-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-frost text-3xl">{s.icon}</span>
                <span className="flex-1">
                  <span className="block text-lg font-bold">{s.title}</span>
                  <span className="block text-sm text-ink-soft">{s.goal}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <RegisterChip r={s.register} />
                    <span className="text-xs font-bold text-ink-soft">{s.level}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </AppShell>
    );
  }

  return (
    <AppShell title={scenario.title} back="/snakk">
      <ConversationProvider>
        <TutorSession scenario={scenario} progress={p} />
      </ConversationProvider>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Live session with the ElevenLabs tutor agent.
// Client tool names must match agent/tutor/client-tools.md.
// ---------------------------------------------------------------------------
type Line = { id: number; who: "du" | "laerer"; text: string };
type Correction = { said: string; better: string; why: string; register: Register };
type Tip = { word: string; tip: string };
type Params = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

function TutorSession({ scenario, progress }: { scenario: Scenario; progress: Progress }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [tip, setTip] = useState<Tip | null>(null);
  const [hits, setHits] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [typed, setTyped] = useState("");

  const conversation = useConversation({
    onMessage: (m: { message: string; source: "user" | "ai" }) =>
      setLines((l) => [...l, { id: Date.now() + Math.random(), who: m.source === "user" ? "du" : "laerer", text: m.message }]),
    onError: (m: unknown) => setError(typeof m === "string" ? m : "Stemmen falt ut. Prøv igjen."),
    onConnect: () => setConnecting(false),
    onDisconnect: () => setConnecting(false),
  });

  const live = conversation.status === "connected";
  const orb: OrbState = connecting ? "connecting" : !live ? "idle" : conversation.isSpeaking ? "speaking" : "listening";
  const home = LEARNER_LANGUAGES.find((l) => l.code === progress.homeLang);

  useConversationClientTool("correct_me", (p: Params) => {
    const reg = (["kompis", "hverdag", "formell", "unnga"].includes(s(p.register)) ? s(p.register) : "hverdag") as Register;
    setCorrections((c) => [{ said: s(p.said), better: s(p.better), why: s(p.why), register: reg }, ...c].slice(0, 6));
    addCard({ no: s(p.better), source: "laerer" });
    return "Vist på skjermen. Be eleven si den bedre versjonen høyt.";
  });

  useConversationClientTool("pronunciation_tip", (p: Params) => {
    setTip({ word: s(p.word), tip: s(p.tip) });
    return "Vist. La eleven prøve ordet igjen.";
  });

  useConversationClientTool("target_hit", (p: Params) => {
    const phrase = s(p.phrase);
    setHits((h) => new Set(h).add(phrase.toLowerCase()));
    addXp(30, "riktig frase");
    if (scenario.id === "fra-tolk") {
      update((st) => ({
        ...st,
        deck: st.deck.map((c) => (c.no.toLowerCase() === phrase.toLowerCase() ? { ...c, practiced: true } : c)),
      }));
      unlock("egen-stemme", "Egen stemme");
    }
    return "Registrert. Ros kort og gå videre.";
  });

  useConversationClientTool("finish_lesson", (p: Params) => {
    addXp(Math.min(Number(p.xp) || 50, 150), "samtale fullført");
    return "XP gitt. Si ha det på en naturlig måte.";
  });

  const start = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/signed-url?agent=tutor");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fikk ikke kontakt med læreren.");
      conversation.startSession({
        signedUrl: data.signedUrl,
        dynamicVariables: {
          nick: progress.nick || "deg",
          level: progress.level ?? "A1",
          home_language: home?.native ?? "English",
          role: scenario.role,
          goal: scenario.goal,
          register: scenario.register,
          targets: scenario.targets.join(" | "),
        },
      });
      unlock("forste-prat", "Første prat");
    } catch (e) {
      setConnecting(false);
      setError((e as Error).message);
    }
  }, [conversation, progress, scenario, home]);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-sheet p-5">
        <p className="text-sm font-bold text-ink-soft">Du snakker med</p>
        <p className="text-lg font-bold">{scenario.role}</p>
        <p className="mt-3 text-sm font-bold text-ink-soft">Prøv å si</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {scenario.targets.map((t) => {
            const hit = hits.has(t.toLowerCase());
            return (
              <li
                key={t}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ${hit ? "bg-gran text-white" : "bg-frost"}`}
              >
                {hit ? "✓ " : ""}
                {t}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="py-2">
        <VoiceOrb state={orb} onClick={live ? () => conversation.endSession() : start} idleLabel="Start samtalen" />
      </div>
      {error && <p className="rounded-2xl bg-tytte-soft p-4 font-bold text-tytte">{error}</p>}

      {tip && (
        <section className="pop rounded-3xl bg-sol-soft p-5">
          <p className="text-sm font-bold">Uttale</p>
          <p className="display text-3xl font-bold">{tip.word}</p>
          <p className="mt-1">{tip.tip}</p>
        </section>
      )}

      {corrections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Rettelser</h2>
          {corrections.map((c, i) => (
            <div key={i} className={`rounded-3xl bg-sheet p-5 ${i === 0 ? "pop" : ""}`}>
              <p className="text-ink-soft line-through decoration-tytte decoration-2">{c.said}</p>
              <p className="mt-1 text-xl font-bold">{c.better}</p>
              <div className="mt-2 flex items-center gap-2">
                <RegisterChip r={c.register} />
                <p className="text-sm text-ink-soft">{c.why}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {lines.length > 0 && (
        <section aria-label="Samtalen" className="space-y-2">
          {lines.slice(-8).map((l) => (
            <p
              key={l.id}
              className={`max-w-[85%] rounded-3xl px-4 py-2.5 ${l.who === "du" ? "ml-auto bg-gran text-white" : "bg-sheet"}`}
            >
              {l.text}
            </p>
          ))}
        </section>
      )}

      {live && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            conversation.sendUserMessage(typed.trim());
            setLines((l) => [...l, { id: Date.now(), who: "du", text: typed.trim() }]);
            setTyped("");
          }}
          className="flex gap-2"
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Eller skriv her"
            aria-label="Skriv en melding"
            className="flex-1 rounded-2xl border-2 border-line bg-sheet px-4 py-3"
          />
          <button className="rounded-2xl bg-ink px-5 font-bold text-white">Send</button>
        </form>
      )}
    </div>
  );
}
