"use client";

import { useCallback, useRef, useState } from "react";
import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from "@elevenlabs/react";
import { LANGUAGES, type WorkerLanguage } from "@/lib/languages";
import { TASKS, WORKERS, findTask } from "@/lib/warehouse";
import type { NewFeedEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Page: pick worker + language, then talk.
// ---------------------------------------------------------------------------
export default function WorkerPage() {
  const [worker, setWorker] = useState<string | null>(null);
  const [lang, setLang] = useState<WorkerLanguage | null>(null);

  if (!worker || !lang) {
    return <Setup worker={worker} setWorker={setWorker} lang={lang} setLang={setLang} />;
  }
  return (
    <ConversationProvider>
      <Assistant worker={worker} lang={lang} onExit={() => setLang(null)} />
    </ConversationProvider>
  );
}

function Setup(props: {
  worker: string | null;
  setWorker: (w: string) => void;
  lang: WorkerLanguage | null;
  setLang: (l: WorkerLanguage) => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-sm uppercase tracking-widest text-sky-300">The Click</p>
        <h1 className="mt-1 text-3xl font-bold">Hvem er du?</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {WORKERS.map((w) => (
          <button
            key={w}
            onClick={() => props.setWorker(w)}
            className={`rounded-2xl px-4 py-5 text-xl font-semibold ${
              props.worker === w ? "bg-sky-500 text-slate-950" : "bg-slate-800"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {props.worker && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Språk</h2>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => props.setLang(l)}
                className="rounded-2xl bg-slate-800 px-4 py-6 text-2xl font-semibold active:bg-sky-500 active:text-slate-950"
              >
                {l.native}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// The voice session + client tools the agent can call.
// Tool names and parameters must match agent/client-tools.md exactly.
// ---------------------------------------------------------------------------
async function postEvent(e: NewFeedEvent) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(e),
    });
  } catch {
    // The dashboard is nice-to-have; never break the conversation because of it.
  }
}

type Params = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

function Assistant({ worker, lang, onExit }: { worker: string; lang: WorkerLanguage; onExit: () => void }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [step, setStep] = useState<number>(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [translated, setTranslated] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const conversation = useConversation({
    onError: (msg: unknown) => setError(typeof msg === "string" ? msg : "Noe gikk galt med stemmen."),
  });
  const active = conversation.status === "connected";
  const task = taskId ? findTask(taskId) : undefined;
  const base = { worker, language: lang.code };

  // --- client tools ---------------------------------------------------------
  useConversationClientTool("show_step", (p: Params) => {
    const t = findTask(s(p.task_id));
    if (!t) return `Ukjent oppgave. Gyldige: ${TASKS.map((x) => x.id).join(", ")}`;
    const n = Number(p.step_number) || 1;
    const st = t.steps.find((x) => x.number === n);
    if (!st) return `Oppgaven har bare ${t.steps.length} steg.`;
    if (t.id !== taskId) {
      setDone(new Set());
      setTranslated({});
    }
    setTaskId(t.id);
    setStep(n);
    if (p.text_translated) setTranslated((m) => ({ ...m, [n]: s(p.text_translated) }));
    return `Viser steg ${n} av ${t.steps.length}: ${st.text_no}`;
  });

  useConversationClientTool("step_done", (p: Params) => {
    const t = findTask(s(p.task_id) || taskId || "");
    if (!t) return "Ingen aktiv oppgave.";
    const n = Number(p.step_number) || step;
    setDone((d) => new Set(d).add(n));
    void postEvent({ ...base, kind: "step_done", text_no: `Steg ${n}/${t.steps.length} i «${t.title_no}»`, meta: { task: t.id } });
    const next = t.steps.find((x) => x.number === n + 1);
    return next ? `Neste steg er ${next.number}: ${next.text_no}` : "Det var siste steg. Kall task_done.";
  });

  useConversationClientTool("task_done", (p: Params) => {
    const t = findTask(s(p.task_id) || taskId || "");
    if (!t) return "Ingen aktiv oppgave.";
    setDone(new Set(t.steps.map((x) => x.number)));
    setNotice("✓");
    void postEvent({ ...base, kind: "task_done", text_no: `Fullførte «${t.title_no}»`, meta: { task: t.id } });
    return "Lagret. Ros arbeideren kort.";
  });

  useConversationClientTool("report_problem", (p: Params) => {
    const type = s(p.problem_type) || "annet";
    const location = s(p.location);
    void postEvent({
      ...base,
      kind: "problem",
      text_no: s(p.text_no) || "Problem meldt",
      text_original: s(p.text_original) || null,
      meta: { type, ...(location ? { location } : {}) },
    });
    setNotice("⚠");
    return "Lederen har fått beskjed.";
  });

  useConversationClientTool("ask_manager", (p: Params) => {
    void postEvent({
      ...base,
      kind: "question",
      text_no: s(p.question_no) || "Spørsmål til leder",
      text_original: s(p.question_original) || null,
    });
    setNotice("?");
    return "Spørsmålet er sendt til lederen. Si til arbeideren at lederen svarer snart, og at de skal vente.";
  });

  useConversationClientTool("grade_return", (p: Params) => {
    const grade = s(p.grade).toUpperCase().slice(0, 1);
    if (!["A", "B", "C"].includes(grade)) return "Grade må være A, B eller C.";
    void postEvent({
      ...base,
      kind: "return_grade",
      text_no: `Retur vurdert som ${grade}: ${s(p.reason_no)}`,
      text_original: s(p.reason_original) || null,
      meta: { grade },
    });
    return `Lagret som ${grade}.`;
  });

  // --- session control ------------------------------------------------------
  const start = useCallback(async () => {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/signed-url");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fikk ikke kontakt med stemmetjenesten.");
      conversation.startSession({
        signedUrl: data.signedUrl,
        dynamicVariables: { worker_name: worker, language_code: lang.code },
        overrides: { agent: { language: lang.code as never, firstMessage: lang.firstMessage } },
      });
      void postEvent({ ...base, kind: "session_start", text_no: `Startet samtale på ${lang.norwegian}` });
    } catch (e) {
      setError((e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, worker, lang]);

  const sendPhoto = useCallback(
    async (file: File) => {
      try {
        const { fileId } = await conversation.uploadFile(file);
        conversation.sendMultimodalMessage({ text: "Her er et bilde av varen.", fileIds: [fileId] });
      } catch {
        setError("Kunne ikke sende bildet.");
      }
    },
    [conversation],
  );

  // Fallback if voice recognition struggles on stage: tap a task.
  const pickTask = (id: string) => {
    const t = findTask(id);
    if (t && active) conversation.sendUserMessage(`Jeg vil lære: ${t.title_no}`);
  };

  // --- UI -------------------------------------------------------------------
  const current = task?.steps.find((x) => x.number === step);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{worker}</p>
          <p className="text-lg font-semibold">{lang.native}</p>
        </div>
        <button onClick={() => { conversation.endSession(); onExit(); }} className="rounded-xl bg-slate-800 px-4 py-2 text-sm">
          ✕
        </button>
      </header>

      {/* Big talk button / status */}
      <button
        onClick={active ? () => conversation.endSession() : start}
        className={`mx-auto flex h-44 w-44 items-center justify-center rounded-full text-5xl transition ${
          !active
            ? "bg-sky-500 text-slate-950"
            : conversation.isSpeaking
              ? "animate-pulse bg-emerald-400 text-slate-950"
              : "bg-slate-700 ring-4 ring-sky-400"
        }`}
        aria-label={active ? "Stopp" : "Start"}
      >
        {!active ? "🎙" : conversation.isSpeaking ? "🔊" : "👂"}
      </button>
      {notice && <p className="text-center text-3xl">{notice}</p>}
      {error && <p className="rounded-xl bg-red-900/60 p-3 text-sm">{error}</p>}

      {/* Current step */}
      {task && current && (
        <section className="rounded-3xl bg-slate-800 p-5">
          <div className="mb-3 flex gap-1">
            {task.steps.map((x) => (
              <span
                key={x.number}
                className={`h-2 flex-1 rounded-full ${
                  done.has(x.number) ? "bg-emerald-400" : x.number === step ? "bg-sky-400" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-400">
            {step} / {task.steps.length}
          </p>
          <p dir="auto" className="mt-2 text-2xl font-semibold leading-snug">
            {translated[step] ?? current.text_no}
          </p>
          {translated[step] && <p className="mt-3 text-sm text-slate-400">🇳🇴 {current.text_no}</p>}
        </section>
      )}

      {/* Fallback task chips */}
      {active && !task && (
        <div className="grid grid-cols-2 gap-3">
          {TASKS.map((t) => (
            <button key={t.id} onClick={() => pickTask(t.id)} className="rounded-2xl bg-slate-800 p-4 text-left">
              {t.title_no}
            </button>
          ))}
        </div>
      )}

      {active && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void sendPhoto(f);
              e.target.value = "";
            }}
          />
          <button onClick={() => fileRef.current?.click()} className="rounded-2xl bg-slate-800 py-5 text-xl font-semibold">
            📷
          </button>
        </>
      )}
    </main>
  );
}
