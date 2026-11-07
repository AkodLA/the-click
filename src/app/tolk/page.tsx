"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { AppShell } from "@/components/AppShell";
import { LEARNER_LANGUAGES } from "@/lib/content";
import { addCard, addXp, unlock, useProgress } from "@/lib/progress";

const MEETINGS = [
  { id: "skole", label: "Utviklingssamtale", icon: "🏫", other: "Lærer" },
  { id: "barnehage", label: "Barnehagen", icon: "🧸", other: "Ansatt" },
  { id: "lege", label: "Fastlegen", icon: "🩺", other: "Lege" },
  { id: "jobb", label: "Første dag på jobb", icon: "📦", other: "Leder" },
];

const YOUR_TURN: Record<string, string> = {
  so: "Ku hadal luqaddaada. Turjumaanku wuu turjumayaa.",
  ar: "تحدث بلغتك. المترجم يترجم.",
  en: "Speak your own language. The interpreter translates.",
};

type Turn = { id: number; from: "no" | "home"; original: string; translation: string };
type Phrase = { no: string; home: string };
type Summary = { home: string; no: string; phrases: Phrase[] };

export default function TolkPage() {
  const p = useProgress();
  const [meeting, setMeeting] = useState<(typeof MEETINGS)[number] | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const homeCode = lang ?? p.homeLang ?? "so";
  const home = LEARNER_LANGUAGES.find((l) => l.code === homeCode) ?? LEARNER_LANGUAGES[0];

  if (!meeting) {
    return (
      <AppShell title="Tolk">
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">La barna være barn.</h1>
        <p className="mt-2 text-ink-soft">
          Legg telefonen mellom dere på bordet. Begge snakker sitt eget språk, tolken tar resten. Etterpå får du en
          oppsummering, og setningene du trengte hjelp med blir leksjonene dine.
        </p>

        <h2 className="mt-6 font-bold">Hvilket møte?</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MEETINGS.map((m) => (
            <button key={m.id} onClick={() => setMeeting(m)} className="rounded-3xl bg-sheet p-4 text-left">
              <span className="text-3xl" aria-hidden>
                {m.icon}
              </span>
              <span className="mt-2 block font-bold">{m.label}</span>
            </button>
          ))}
        </div>

        <h2 className="mt-6 font-bold">Ditt språk</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEARNER_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={homeCode === l.code}
              className={`rounded-full px-4 py-2 font-bold ${homeCode === l.code ? "bg-ink text-white" : "bg-sheet"}`}
            >
              {l.flag} {l.native}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-fjord-soft p-5">
          <p className="font-bold text-fjord">Alvorlig samtale?</p>
          <p className="mt-1">
            Ved barnevern, diagnoser eller juridiske saker skal du ha en kvalifisert tolk. Prat er for hverdagsmøtene.
          </p>
          <a
            href="https://www.tolkeportalen.no"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-bold text-fjord underline"
          >
            Finn kvalifisert tolk i Tolkeportalen
          </a>
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Tolkeloven § 4: offentlige organer skal ikke bruke barn som tolk.
        </p>
      </AppShell>
    );
  }

  return (
    <ConversationProvider>
      <Meeting meeting={meeting} homeCode={home.code} homeName={home.native} onExit={() => setMeeting(null)} />
    </ConversationProvider>
  );
}

// ---------------------------------------------------------------------------
// The table view: the top half faces the other person (rotated), the bottom half faces you.
// Client tool names must match agent/tolk/client-tools.md.
// ---------------------------------------------------------------------------
type Params = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

function Meeting({
  meeting,
  homeCode,
  homeName,
  onExit,
}: {
  meeting: (typeof MEETINGS)[number];
  homeCode: string;
  homeName: string;
  onExit: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const conversation = useConversation({
    onError: (m: unknown) => setError(typeof m === "string" ? m : "Tolken falt ut. Prøv igjen."),
    onConnect: () => setConnecting(false),
    onDisconnect: () => setConnecting(false),
  });
  const live = conversation.status === "connected";

  useEffect(() => () => demoTimers.current.forEach(clearTimeout), []);

  const log = (t: Omit<Turn, "id">) => setTurns((x) => [...x, { ...t, id: Date.now() + Math.random() }]);

  const finish = useCallback((sum: Summary) => {
    setSummary(sum);
    sum.phrases.forEach((ph) => addCard({ no: ph.no, home: ph.home, source: "tolk" }));
    addXp(120, "møte uten barn som tolk");
    unlock("tolket", "Ingen barn som tolk");
  }, []);

  useConversationClientTool("interpret", (p: Params) => {
    log({ from: s(p.from) === "no" ? "no" : "home", original: s(p.original), translation: s(p.translation) });
    return "Vist på skjermen.";
  });

  useConversationClientTool("end_meeting", (p: Params) => {
    let phrases: Phrase[] = [];
    try {
      const raw = typeof p.phrases === "string" ? JSON.parse(p.phrases) : p.phrases;
      if (Array.isArray(raw)) phrases = raw.map((x) => ({ no: s(x.no), home: s(x.home) })).filter((x) => x.no);
    } catch {
      /* agent sent plain text: summary still works without phrases */
    }
    finish({ home: s(p.summary_home), no: s(p.summary_no), phrases: phrases.slice(0, 5) });
    return "Oppsummering vist og setningene er lagt til i leksjonene.";
  });

  const start = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/signed-url?agent=tolk");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fikk ikke kontakt med tolken.");
      conversation.startSession({
        signedUrl: data.signedUrl,
        dynamicVariables: { meeting: meeting.label, other_role: meeting.other, home_language: homeName, home_code: homeCode },
      });
    } catch (e) {
      setConnecting(false);
      setError((e as Error).message);
    }
  }, [conversation, meeting, homeName, homeCode]);

  // Stage-safe demo: a scripted parent–teacher meeting (works without wifi or microphone).
  // Aden: check the Somali lines before the pitch.
  const runDemo = () => {
    setTurns([]);
    setSummary(null);
    const script: Omit<Turn, "id">[] = [
      { from: "no", original: "Hei, så fint at du kom. Ayaan har hatt et veldig godt halvår.", translation: "Haye, waad ku mahadsan tahay imaatinka. Ayaan waxay lahayd lix bilood oo aad u wanaagsan." },
      { from: "home", original: "Sideey ugu faraxsan tahay iskuulka?", translation: "Hvordan trives hun på skolen?" },
      { from: "no", original: "Hun trives godt og har mange venner. Lesing kan vi jobbe mer med.", translation: "Way ku faraxsan tahay, saaxiibo badanna way leedahay. Akhriska ayaan ku shaqeyn karnaa." },
      { from: "home", original: "Maxaan ku tababaran karnaa guriga?", translation: "Hva kan vi øve på hjemme?" },
      { from: "no", original: "Ti minutter lesing hver kveld, gjerne høyt. Det holder.", translation: "Toban daqiiqo oo akhris ah habeen kasta, kor u akhri. Taasi way ku filan tahay." },
    ];
    script.forEach((t, i) => demoTimers.current.push(setTimeout(() => log(t), 900 + i * 1800)));
    demoTimers.current.push(
      setTimeout(
        () =>
          finish({
            home: "Ayaan way ku faraxsan tahay iskuulka. Habeen kasta toban daqiiqo akhri iyada.",
            no: "Ayaan trives. Hjemme: ti minutter høytlesing hver kveld.",
            phrases: [
              { no: "Hvordan trives hun på skolen?", home: "Sideey ugu faraxsan tahay iskuulka?" },
              { no: "Hva kan vi øve på hjemme?", home: "Maxaan ku tababaran karnaa guriga?" },
              { no: "Kan vi ta et nytt møte i mars?", home: "Ma yeelan karnaa kulan kale bisha Maarso?" },
            ],
          }),
        900 + script.length * 1800 + 600,
      ),
    );
  };

  const otherSide = turns.filter((t) => t.from === "home").slice(-1)[0];
  const mySide = turns.filter((t) => t.from === "no").slice(-1)[0];

  if (summary) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-6">
        <p className="text-5xl" aria-hidden>
          🤝
        </p>
        <h1 className="text-3xl font-extrabold">Møtet er ferdig. Ingen barn trengte å tolke.</h1>
        <section className="rounded-3xl bg-sheet p-5">
          <p className="text-sm font-bold text-ink-soft">Til deg, på {homeName}</p>
          <p dir="auto" className="mt-1 text-lg">
            {summary.home}
          </p>
          <p className="mt-4 text-sm font-bold text-ink-soft">Til {meeting.other.toLowerCase()}en, på norsk</p>
          <p className="mt-1">{summary.no}</p>
        </section>
        {summary.phrases.length > 0 && (
          <section className="rounded-3xl bg-gran p-5 text-white">
            <p className="font-bold text-gran-soft">Neste gang sier du dette selv</p>
            <ul className="mt-3 space-y-2">
              {summary.phrases.map((ph) => (
                <li key={ph.no} className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="font-bold">{ph.no}</p>
                  <p dir="auto" className="text-sm text-gran-soft">
                    {ph.home}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/snakk?ov=tolk" className="mt-4 block rounded-2xl bg-sol py-3 text-center font-bold text-ink">
              Øv på dem nå
            </Link>
          </section>
        )}
        <Link href="/" className="text-center font-bold text-ink-soft">
          Til forsiden
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid h-dvh max-w-md grid-rows-[1fr_auto_1fr] bg-frost">
      {/* Their side, upside down so the person across the table can read it */}
      <section className="flex rotate-180 flex-col justify-center gap-2 bg-sheet px-6 py-4">
        <p className="text-sm font-bold text-ink-soft">
          {meeting.other} · norsk
        </p>
        <p className="text-2xl font-bold leading-snug">
          {otherSide ? otherSide.translation : "Snakk norsk som vanlig. Tolken oversetter."}
        </p>
      </section>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button onClick={() => { conversation.endSession(); onExit(); }} className="rounded-full bg-sheet px-4 py-2 font-bold">
          Avslutt
        </button>
        <button
          onClick={live ? () => conversation.sendUserMessage("Vi er ferdige. Lag oppsummeringen nå.") : start}
          className={`flex-1 rounded-full py-3 font-bold ${live ? "orb-live bg-sol" : "bg-gran text-white"}`}
        >
          {connecting ? "Kobler til …" : live ? (conversation.isSpeaking ? "Tolker …" : "Lytter · trykk for å avslutte møtet") : "Start tolken"}
        </button>
        {!live && (
          <button onClick={runDemo} className="rounded-full bg-sheet px-4 py-2 text-sm font-bold" title="Spill av et eksempelmøte uten mikrofon">
            Demo
          </button>
        )}
      </div>

      {/* Your side */}
      <section className="flex flex-col justify-center gap-2 bg-sheet px-6 py-4">
        <p className="text-sm font-bold text-ink-soft">Du · {homeName}</p>
        <p dir="auto" className="text-2xl font-bold leading-snug">
          {mySide ? mySide.translation : (YOUR_TURN[homeCode] ?? YOUR_TURN.en)}
        </p>
        {error && <p className="font-bold text-tytte">{error}</p>}
      </section>
    </div>
  );
}
