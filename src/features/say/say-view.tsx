"use client";
/**
 * /say (T23): "Say it in Norwegian". Say or type something in English → get it in Norwegian as text
 * or as a voice message you can play, download or share. Then say it yourself.
 *
 * Translation order (best first):
 *   1. Snakk's own human-checked translations (src/lib/web-ai/memory.ts), instant and free.
 *   2. The "Snakk Message" agent (agent/message-prompt.md, text only), which picks the right tone.
 *   3. The browser's on-device translator (Opera Web AI / Chrome), nothing leaves the device.
 * Voice message: ElevenLabs text-to-speech via POST /api/say/voice, else the device's own voice.
 * Nothing is stored on a server; this visit's messages live in this tab only.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Badge, Button, Card, RegisterTag, SectionTitle } from "@/components/ui";
import { ExplainText } from "@/features/explain/explain-text";
import { SaveToNotes } from "@/features/notes/save-to-notes";
import { phrases, vocabWords } from "@/lib/content";
import type { Register } from "@/lib/content/types";
import { useProgress } from "@/lib/progress/store";
import { canSpeak, speakNorwegian } from "@/lib/speech";
import { fromMemory, glossaryNotes, type GlossaryNote } from "@/lib/web-ai/memory";
import { translateText } from "@/lib/web-ai/translator";
import { askMessageAgent } from "./message-agent";
import { pickListenMode, useEnglishRecorder, type ListenMode } from "./recorder";

type Tone = "friendly" | "polite";
type Via = "memory" | "agent" | "device";

interface Message {
  id: number;
  english: string;
  norwegian: string;
  via: Via;
  tone: Tone;
  register: Register | null;
  literal?: string;
  tip?: string;
  notes: GlossaryNote[];
}

interface SayConfig {
  listen: boolean;
  voice: boolean;
  agent: boolean;
}

/** Who the message is for: sets the tone and gives the agent context. */
const AUDIENCES: { id: string; emoji: string; label: string; tone: Tone; context: string }[] = [
  { id: "friend", emoji: "😄", label: "A friend", tone: "friendly", context: "a text or chat with a friend" },
  { id: "neighbour", emoji: "🏠", label: "A neighbour", tone: "friendly", context: "talking to a neighbour" },
  { id: "work", emoji: "💼", label: "Work", tone: "polite", context: "a message to a colleague or manager" },
  { id: "school", emoji: "🏫", label: "School", tone: "polite", context: "a message to my child's teacher or kindergarten" },
  { id: "official", emoji: "🏛️", label: "Office (NAV…)", tone: "polite", context: "a formal message to a public office (NAV, UDI, kommune, doctor)" },
];

const EXAMPLES = [
  "Sorry I'm late, the bus didn't come.",
  "Can we move my appointment to Thursday?",
  "My son is sick today and stays at home.",
  "Do you want to grab a coffee this weekend?",
];

const VIA_LABEL: Record<Via, string> = {
  memory: "✅ Checked by Snakk",
  agent: "🤖 Snakk Message agent",
  device: "📱 Translated on your device",
};

/** The register of a checked translation, if it's one of our phrases or words. */
function knownRegister(norwegian: string): Register | null {
  return phrases.find((p) => p.text === norwegian || p.example.no === norwegian)?.register ?? vocabWords.find((w) => w.no === norwegian)?.register ?? null;
}

export function SayView() {
  const p = useProgress();
  const [config, setConfig] = useState<SayConfig | null>(null);
  const [listenMode, setListenMode] = useState<ListenMode>("none");
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const seq = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // What this server can do (booleans only). Offline or old server → treat everything as off.
  useEffect(() => {
    let alive = true;
    fetch("/api/say/config")
      .then((r) => r.json())
      .then((j: { ok: boolean; data?: SayConfig }) => (j.ok && j.data ? j.data : { listen: false, voice: false, agent: false }))
      .catch(() => ({ listen: false, voice: false, agent: false }))
      .then((c) => {
        if (!alive) return;
        setConfig(c);
        setListenMode(pickListenMode(c.listen));
      });
    return () => {
      alive = false;
    };
  }, []);

  const recorder = useEnglishRecorder(listenMode, (heard) => {
    setDraft(heard);
    void translate(heard); // what you said goes straight to Norwegian; it stays in the box so you can fix it
  });

  async function translate(raw: string) {
    const english = raw.trim().slice(0, 500);
    if (!english || busy) return;
    setError(null);
    let result: Omit<Message, "id" | "english" | "tone" | "notes"> | null = null;

    // 1. Our human-checked translations.
    const known = fromMemory(english, "en", "nb");
    if (known) result = { norwegian: known, via: "memory", register: knownRegister(known) };

    // 2. The Snakk Message agent (picks the tone).
    if (!result && config?.agent) {
      setBusy("Writing it the Norwegian way…");
      const a = await askMessageAgent(english, { tone: audience.tone, learner_level: p.cefr ?? "A1", context: audience.context });
      if (a && !a.norwegian && a.tip) {
        setBusy(null);
        setError(a.tip);
        return;
      }
      if (a?.norwegian) result = { norwegian: a.norwegian, via: "agent", register: a.register, literal: a.literal, tip: a.tip };
    }

    // 3. The on-device translator.
    if (!result) {
      setBusy("Translating on your device…");
      const r = await translateText(english, "en", "nb", (l) => setBusy(`Getting the translator… ${Math.round(l * 100)}%`), { memory: false });
      if (!r.ok) {
        setBusy(null);
        setError(r.message);
        return;
      }
      result = {
        norwegian: r.text,
        via: "device",
        register: null,
        tip: audience.tone === "polite" ? "Machine translation can't choose the tone. For a polite message, add «vær så snill» (please) and «takk på forhånd» (thanks in advance)." : undefined,
      };
    }

    setBusy(null);
    const msg: Message = { ...result, id: ++seq.current, english, tone: audience.tone, notes: glossaryNotes(result.norwegian) };
    setMessages((m) => [msg, ...m].slice(0, 6));
    setDraft("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void translate(draft);
  }

  const rec = recorder.state;
  const latest = messages[0];

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">🗣️ Say it in Norwegian</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Say it in English. Send it in Norwegian.</h1>
        <p className="mt-2 text-sm opacity-90">
          Need to text a teacher, a neighbour or NAV? Say or type it in English and get the natural Norwegian, as text or as a voice message. Then say it
          yourself: that&apos;s how it sticks.
        </p>
      </section>

      {/* Who is it for? Sets friendly or polite. */}
      <section aria-labelledby="say-who">
        <h2 id="say-who" className="mb-2 text-sm font-bold text-muted">
          Who is it for?
        </h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Who is the message for">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={audience.id === a.id}
              onClick={() => setAudience(a)}
              className={`h-11 rounded-full border-2 px-4 text-sm font-bold transition ${
                audience.id === a.id ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink"
              }`}
            >
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-muted">
          Tone: {audience.tone === "friendly" ? "😄 friendly (informal)" : "🤝 polite (neutral)"}
          {config && !config.agent && " · the device translator can't change tone"}
        </p>
      </section>

      <Card className="flex flex-col gap-3">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label htmlFor="say-input" className="font-bold">
            What do you want to say?
          </label>
          <textarea
            id="say-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={3}
            lang="en"
            placeholder="e.g. Can we move my appointment to Thursday?"
            className="w-full resize-none rounded-2xl border border-line bg-bg px-4 py-3 text-base focus:border-brand focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void translate(draft);
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {listenMode !== "none" &&
              (rec.kind === "recording" ? (
                <Button type="button" variant="accent" onClick={recorder.stop} className="flex-1">
                  ⏹️ Stop ({15 - rec.seconds}s)
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => void recorder.start()} disabled={rec.kind === "working" || !!busy} className="flex-1">
                  {rec.kind === "working" ? "👂 Listening…" : "🎙️ Speak"}
                </Button>
              ))}
            <Button type="submit" disabled={!draft.trim() || !!busy || rec.kind === "recording"} className="flex-1">
              🇳🇴 Translate
            </Button>
          </div>
        </form>
        {listenMode === "browser" && (
          <p className="text-xs text-muted">🔒 The mic uses your browser&apos;s speech recognition, which may send audio to Google or Apple. Prefer privacy? Type instead.</p>
        )}
        {config && listenMode === "none" && <p className="text-xs text-muted">⌨️ Type your message. (Speaking needs a browser with a microphone.)</p>}
        {busy && (
          <p className="text-sm font-semibold text-brand" role="status">
            ⏳ {busy}
          </p>
        )}
        {(error || rec.kind === "error") && (
          <div className="rounded-2xl bg-warn-soft p-3 text-sm" role="alert">
            <p>⚠️ {error ?? (rec.kind === "error" ? rec.message : "")}</p>
            {error && (
              <Link href="/translator" className="mt-1 inline-block font-semibold text-brand underline">
                Check your translator →
              </Link>
            )}
          </div>
        )}
      </Card>

      {!latest && (
        <section aria-labelledby="say-try">
          <SectionTitle>
            <span id="say-try">Try one</span>
          </SectionTitle>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setDraft(ex);
                  inputRef.current?.focus();
                }}
                className="min-h-11 rounded-2xl border border-line bg-surface px-4 py-2 text-left text-sm font-semibold hover:bg-surface-2"
              >
                💬 {ex}
              </button>
            ))}
          </div>
        </section>
      )}

      {latest && <MessageCard key={latest.id} m={latest} voiceOnServer={!!config?.voice} />}

      {messages.length > 1 && (
        <section aria-labelledby="say-recent">
          <SectionTitle>
            <span id="say-recent">Earlier this visit</span>
          </SectionTitle>
          <ul className="flex flex-col gap-2">
            {messages.slice(1).map((m) => (
              <li key={m.id} className="rounded-2xl border border-line bg-surface p-3 text-sm">
                <p className="text-muted">{m.english}</p>
                <p className="font-bold" lang="nb">
                  «{m.norwegian}»
                </p>
                <div className="mt-1 flex gap-3">
                  {canSpeak() && (
                    <button type="button" className="min-h-11 font-semibold text-brand" onClick={() => speakNorwegian(m.norwegian)} aria-label={`Listen to «${m.norwegian}»`}>
                      🔊 Listen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-muted">
        Need a live conversation instead? <Link href="/tolk" className="font-semibold text-brand underline">Use Tolk 🧑‍🤝‍🧑</Link>
      </p>
    </div>
  );
}

function MessageCard({ m, voiceOnServer }: { m: Message; voiceOnServer: boolean }) {
  const [copied, setCopied] = useState(false);
  const [practised, setPractised] = useState(0);

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.norwegian);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-2 border-brand" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={m.via === "memory" ? "success" : "muted"}>{VIA_LABEL[m.via]}</Badge>
        {m.register && <RegisterTag register={m.register} />}
      </div>
      <div>
        <p className="text-sm text-muted">{m.english}</p>
        <p className="mt-1 text-2xl font-extrabold leading-snug" lang="nb">
          <ExplainText text={m.norwegian} />
        </p>
        {m.literal && <p className="mt-1 text-sm text-muted">Word for word: {m.literal}</p>}
        <p className="mt-1 text-xs text-muted">Tap a word to see what it means.</p>
      </div>

      {m.notes.length > 0 && (
        <div className="rounded-2xl bg-brand-soft p-3 text-sm">
          {m.notes.map((n) => (
            <p key={n.term}>
              ℹ️ <span className="font-bold" lang="nb">{n.term}</span>: {n.explain}
            </p>
          ))}
        </div>
      )}
      {m.tip && <p className="rounded-2xl bg-accent-soft p-3 text-sm">💡 {m.tip}</p>}

      <VoiceMessage text={m.norwegian} voiceOnServer={voiceOnServer} />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copy} className="flex-1">
          {copied ? "✅ Copied" : "📋 Copy text"}
        </Button>
        <SaveToNotes text={m.norwegian} meaning={m.english} register={m.register ?? undefined} source="manual" href="/say" className="flex-1" />
      </div>

      {/* The learning part: don't just send it, say it. */}
      <div className="rounded-2xl bg-surface-2 p-3">
        <p className="font-bold">🗣️ Now say it yourself, twice.</p>
        <p className="text-sm text-muted">Listen, then say it out loud. Saying it is how it sticks.</p>
        {practised < 2 ? (
          <Button onClick={() => setPractised((n) => n + 1)} className="mt-2 w-full">
            ✅ I said it ({practised}/2)
          </Button>
        ) : (
          <p className="mt-2 font-bold text-success" role="status">
            🎉 Done! You said it twice.
          </p>
        )}
        {practised >= 2 && (
          <p className="mt-2 text-sm">
            Want feedback on your pronunciation? Practise phrases in the{" "}
            <Link href="/phrases" className="font-semibold text-brand underline">
              phrasebook
            </Link>{" "}
            or a real chat in{" "}
            <Link href="/speak" className="font-semibold text-brand underline">
              Speak
            </Link>
            .
          </p>
        )}
      </div>
    </Card>
  );
}

/** The voice message: server audio (play, download, share) or the device's own voice. */
function VoiceMessage({ text, voiceOnServer }: { text: string; voiceOnServer: boolean }) {
  const [state, setState] = useState<{ kind: "idle" } | { kind: "loading" } | { kind: "ready"; url: string; file: File } | { kind: "error"; message: string }>({ kind: "idle" });
  const [slow, setSlow] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  async function make(slower: boolean) {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/say/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 300), slow: slower }),
      });
      if (!res.ok || !res.headers.get("content-type")?.startsWith("audio/")) {
        const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(j?.error?.message ?? "Couldn't make the voice message.");
      }
      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setState({ kind: "ready", url, file: new File([blob], "snakk-message.mp3", { type: "audio/mpeg" }) });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Couldn't make the voice message." });
    }
  }

  async function share(file: File) {
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
    } catch {
      // The person closed the share sheet: nothing to do.
    }
  }

  const tooLong = text.length > 300;
  const canShareFiles = typeof navigator !== "undefined" && state.kind === "ready" && !!navigator.canShare?.({ files: [state.file] });

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line p-3">
      <p className="font-bold">🎧 Voice message</p>
      <div className="flex flex-wrap gap-2">
        {canSpeak() && (
          <Button variant="secondary" onClick={() => speakNorwegian(text, { slow })} className="flex-1" aria-label="Listen with this device's voice">
            🔊 Listen
          </Button>
        )}
        {voiceOnServer && !tooLong && state.kind !== "ready" && (
          <Button onClick={() => void make(slow)} disabled={state.kind === "loading"} className="flex-1">
            {state.kind === "loading" ? "⏳ Making it…" : "🎙️ Make voice message"}
          </Button>
        )}
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={slow}
          onChange={(e) => {
            setSlow(e.target.checked);
            if (state.kind === "ready") void make(e.target.checked);
          }}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        🐢 Slower, for learners
      </label>

      {state.kind === "ready" && (
        <>
          <audio src={state.url} controls className="w-full" aria-label="Your Norwegian voice message" />
          <div className="flex flex-wrap gap-2">
            <a
              href={state.url}
              download="snakk-message.mp3"
              className="flex h-11 flex-1 items-center justify-center rounded-full border-2 border-line bg-surface px-4 text-sm font-bold"
            >
              ⬇️ Download
            </a>
            {canShareFiles && (
              <Button variant="secondary" onClick={() => void share(state.file)} className="flex-1">
                📤 Send
              </Button>
            )}
          </div>
        </>
      )}
      {state.kind === "error" && (
        <p className="text-sm text-warn" role="alert">
          ⚠️ {state.message} Use 🔊 Listen instead.
        </p>
      )}
      {!voiceOnServer && <p className="text-xs text-muted">Voice messages to download or send need the server voice. 🔊 Listen uses this device&apos;s voice.</p>}
      {voiceOnServer && tooLong && <p className="text-xs text-muted">Voice messages are for short texts (300 characters). 🔊 Listen works for any length.</p>}
      {!canSpeak() && !voiceOnServer && <p className="text-xs text-muted">This browser has no Norwegian voice. Copy the text instead.</p>}
    </div>
  );
}
