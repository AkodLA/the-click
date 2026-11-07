"use client";

// Manager dashboard – shown on the projector. Everything in Norwegian.
// Polls /api/events every 1.5 s (works with both the in-memory store and Supabase).
import { useEffect, useMemo, useState } from "react";
import type { FeedEvent } from "@/lib/types";
import { languageName } from "@/lib/languages";
import { WAREHOUSE_NAME } from "@/lib/warehouse";

const KIND_LABEL: Record<FeedEvent["kind"], { icon: string; label: string; color: string }> = {
  session_start: { icon: "🎙", label: "Startet", color: "text-slate-300" },
  step_done: { icon: "✓", label: "Steg", color: "text-emerald-300" },
  task_done: { icon: "🏁", label: "Fullført", color: "text-emerald-300" },
  problem: { icon: "⚠", label: "Avvik", color: "text-amber-300" },
  question: { icon: "?", label: "Spørsmål", color: "text-sky-300" },
  return_grade: { icon: "↩", label: "Retur", color: "text-violet-300" },
};

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ManagerPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [online, setOnline] = useState(true);
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const data = await res.json();
        if (alive && res.ok) {
          setEvents(data.events);
          setOnline(true);
        }
      } catch {
        if (alive) setOnline(false);
      }
    };
    load();
    const id = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const questions = useMemo(
    () => events.filter((e) => e.kind === "question" && !answered.has(e.id)),
    [events, answered],
  );
  const problems = useMemo(() => events.filter((e) => e.kind === "problem"), [events]);
  const stats = useMemo(() => {
    const workers = new Set(events.map((e) => e.worker));
    const languages = new Set(events.map((e) => e.language));
    return {
      workers: workers.size,
      languages: languages.size,
      tasks: events.filter((e) => e.kind === "task_done").length,
      questions: events.filter((e) => e.kind === "question").length,
    };
  }, [events]);

  return (
    <main className="min-h-dvh bg-slate-950 px-6 py-6 text-slate-100">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-sky-300">The Click · Lederoversikt</p>
          <h1 className="text-3xl font-bold">{WAREHOUSE_NAME}</h1>
        </div>
        <span className={`text-sm ${online ? "text-emerald-400" : "text-red-400"}`}>
          ● {online ? "Live" : "Frakoblet"}
        </span>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Medarbeidere" value={stats.workers} />
        <Stat label="Språk i bruk" value={stats.languages} />
        <Stat label="Oppgaver fullført" value={stats.tasks} />
        <Stat label="Spørsmål til leder" value={stats.questions} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Questions the agent could not answer from the SOPs */}
        <section className="rounded-2xl bg-slate-900 p-5 lg:col-span-1">
          <h2 className="mb-4 text-xl font-semibold text-sky-300">Venter på svar fra deg</h2>
          {questions.length === 0 && <p className="text-slate-500">Ingen åpne spørsmål.</p>}
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id} className="rounded-xl bg-sky-950/60 p-4">
                <p className="text-sm text-slate-400">
                  {q.worker} · {languageName(q.language)} · {time(q.created_at)}
                </p>
                <p className="mt-1 text-lg font-medium">«{q.text_no}»</p>
                {q.text_original && (
                  <p dir="auto" className="mt-1 text-sm text-slate-500">
                    {q.text_original}
                  </p>
                )}
                <button
                  onClick={() => setAnswered((a) => new Set(a).add(q.id))}
                  className="mt-3 rounded-lg bg-slate-800 px-3 py-1 text-sm"
                >
                  Merk som besvart
                </button>
              </li>
            ))}
          </ul>

          <h2 className="mb-4 mt-8 text-xl font-semibold text-amber-300">Avvik på lageret</h2>
          {problems.length === 0 && <p className="text-slate-500">Ingen avvik meldt.</p>}
          <ul className="space-y-3">
            {problems.map((p) => (
              <li key={p.id} className="rounded-xl bg-amber-950/40 p-4">
                <p className="text-sm text-slate-400">
                  {p.worker} · {time(p.created_at)}
                  {p.meta?.location ? ` · ${p.meta.location}` : ""}
                </p>
                <p className="mt-1 text-lg">{p.text_no}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Live feed */}
        <section className="rounded-2xl bg-slate-900 p-5 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Live</h2>
          {events.length === 0 && <p className="text-slate-500">Venter på aktivitet …</p>}
          <ul className="divide-y divide-slate-800">
            {events.map((e) => {
              const k = KIND_LABEL[e.kind];
              return (
                <li key={e.id} className="flex items-start gap-4 py-3">
                  <span className={`w-6 text-center text-xl ${k.color}`}>{k.icon}</span>
                  <div className="flex-1">
                    <p className="text-lg">
                      <span className="font-semibold">{e.worker}</span> · {e.text_no}
                    </p>
                    <p className="text-sm text-slate-500">
                      {k.label} · {languageName(e.language)} · {time(e.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-5">
      <p className="text-4xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}
