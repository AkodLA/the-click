"use client";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TANDEM, type TandemPartner } from "@/lib/content";
import { addXp, unlock, useProgress } from "@/lib/progress";

// Contact details break anonymity, so the chat blocks them before they're sent.
const CONTACT = /(\d[\s-]?){8,}|@|snap|insta|tiktok|facebook|whatsapp|telegram|\bnummer(et)? mitt\b/i;

type Msg = { id: number; me: boolean; text: string; lang: "no" | "other" };

export default function TandemPage() {
  const p = useProgress();
  const [learn, setLearn] = useState("Spansk");
  const [partner, setPartner] = useState<TandemPartner | null>(null);

  if (partner) return <Chat partner={partner} myNick={p.nick || "Deg"} onBack={() => setPartner(null)} />;

  const matches = [...TANDEM];

  return (
    <AppShell title="Tandem" back="/">
      <p className="text-ink-soft">
        Du lærer bort norsk, og får et annet språk tilbake. Bare kallenavn og avatarer, aldri ansikt eller nummer.
      </p>

      <fieldset className="mt-5">
        <legend className="font-bold">Jeg vil lære</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Spansk", "Arabisk", "Somali", "Polsk"].map((l) => (
            <button
              key={l}
              onClick={() => setLearn(l)}
              aria-pressed={learn === l}
              className={`rounded-full px-4 py-2 font-bold ${learn === l ? "bg-ink text-white" : "bg-sheet"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>

      <h2 className="mt-6 font-bold">Passer for deg</h2>
      <ul className="mt-3 space-y-3">
        {matches
          .sort((a, b) => Number(b.learns === learn) - Number(a.learns === learn))
          .map((t) => (
            <li key={t.nick}>
              <button onClick={() => setPartner(t)} className="flex w-full items-center gap-4 rounded-3xl bg-sheet p-4 text-left">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl ${t.hue}`} aria-hidden>
                  {t.avatar}
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-bold">{t.nick}</span>
                  <span className="block text-sm text-ink-soft">
                    Kan {t.speaks.toLowerCase()} · lærer {t.learns.toLowerCase()} ({t.level})
                  </span>
                  <span className="block text-sm text-ink-soft">Liker å snakke om {t.topic.toLowerCase()}</span>
                </span>
                {t.learns === learn && <span className="rounded-full bg-gran-soft px-2 py-1 text-xs font-bold text-gran-deep">Match</span>}
              </button>
            </li>
          ))}
      </ul>
      <p className="mt-6 text-sm text-ink-soft">Eksempelprofiler i demoen.</p>
    </AppShell>
  );
}

function Chat({ partner, myNick, onBack }: { partner: TandemPartner; myNick: string; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 1, me: false, text: "Hei! Skal vi ta norsk først i 15 minutter?", lang: "no" },
  ]);
  const [text, setText] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [half, setHalf] = useState<"no" | "other">("no");
  const [seconds, setSeconds] = useState(15 * 60);
  const [call, setCall] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      addXp(25, "tandem");
      unlock("tandem", "Bytte språk");
    }
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    if (CONTACT.test(v)) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    setMsgs((m) => [...m, { id: Date.now(), me: true, text: v, lang: half }]);
    setText("");
    setTimeout(
      () =>
        setMsgs((m) => [
          ...m,
          { id: Date.now() + 1, me: false, text: half === "no" ? "Haha, digg! Hva gjør du i helgen?" : "¡Muy bien! ¿Y tú?", lang: half },
        ]),
      1400,
    );
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (call) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-between bg-ink px-6 py-10 text-white">
        <p className="font-bold text-white/70">Samtale med avatar · ingen kamera</p>
        <div className="flex flex-col items-center gap-6">
          <span className={`orb-live grid h-44 w-44 place-items-center rounded-full text-7xl ${partner.hue}`} aria-hidden>
            {partner.avatar}
          </span>
          <p className="display text-3xl font-bold">{partner.nick}</p>
          <p className="text-white/70">Stemmen din kan forvrenges i innstillingene.</p>
        </div>
        <button onClick={() => setCall(false)} className="rounded-full bg-tytte px-8 py-4 font-bold">
          Legg på
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-sheet px-4 py-3">
        <button onClick={onBack} aria-label="Tilbake" className="grid h-10 w-10 place-items-center rounded-full bg-frost">
          ←
        </button>
        <span className={`grid h-10 w-10 place-items-center rounded-full text-xl ${partner.hue}`} aria-hidden>
          {partner.avatar}
        </span>
        <div className="flex-1">
          <p className="font-bold">{partner.nick}</p>
          <p className="text-xs text-ink-soft">Du er {myNick}</p>
        </div>
        <button onClick={() => setCall(true)} className="rounded-full bg-gran px-3 py-2 text-sm font-bold text-white">
          📞 Avatar-samtale
        </button>
      </header>

      <div className="flex items-center justify-between bg-frost px-4 py-2 text-sm">
        <span>
          Nå: <b>{half === "no" ? "norsk" : partner.learns === "Spansk" ? "spansk" : partner.learns.toLowerCase()}</b> · {mm}:{ss}
        </span>
        <button
          onClick={() => {
            setHalf(half === "no" ? "other" : "no");
            setSeconds(15 * 60);
          }}
          className="font-bold underline"
        >
          Bytt språk
        </button>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {msgs.map((m) => (
          <li key={m.id} className={`max-w-[80%] rounded-3xl px-4 py-2.5 ${m.me ? "ml-auto bg-gran text-white" : "bg-sheet"}`}>
            {m.text}
          </li>
        ))}
      </ul>

      {blocked && (
        <p className="mx-4 mb-2 rounded-2xl bg-tytte-soft p-3 text-sm font-bold text-tytte">
          Ikke sendt: telefonnummer og brukernavn holder vi utenfor, så dere begge forblir anonyme.
        </p>
      )}
      <form onSubmit={send} className="flex gap-2 border-t border-line bg-sheet p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv en melding"
          aria-label="Melding"
          className="flex-1 rounded-2xl border-2 border-line px-4 py-3"
        />
        <button className="rounded-2xl bg-ink px-5 font-bold text-white">Send</button>
      </form>
    </div>
  );
}
