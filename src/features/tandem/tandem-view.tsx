"use client";
/**
 * Tandem (/tandem): swap languages with a native speaker, anonymously. Owner: T10.
 *   match ("I speak X, I want Y") → partner cards (nickname + avatar only) → chat with a scripted partner + corrections
 * Each message you send reports `tandem_message_sent`; the server gives the XP (capped per day).
 * Nothing about the chat is stored on a server. Partners are TEST DATA.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { LANGUAGE_NAMES, tandemPartners } from "@/lib/content";
import type { TandemPartner } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";
import { contactInfoWarning, correct, PARTNER_FILLERS, partnerScript, phrasesUsed, type ScriptLine } from "./tandem-data";

const MAX_LEN = 280;

export function TandemView() {
  const p = useProgress();
  const [speakCode, setSpeakCode] = useState<string | null>(null);
  const [wantCode, setWantCode] = useState("nb");
  const [partner, setPartner] = useState<TandemPartner | null>(null);

  const speak = speakCode ?? (p.nativeLanguage && p.nativeLanguage !== "nb" && LANGUAGE_NAMES[p.nativeLanguage] ? p.nativeLanguage : "en");

  if (partner) {
    return <Chat key={partner.id} partner={partner} myLanguage={speak} onBack={() => setPartner(null)} />;
  }

  // Perfect match: they speak what I want AND want what I speak. Good match: they speak what I want.
  const perfect = tandemPartners.filter((t) => t.offers === wantCode && t.wants === speak);
  const good = tandemPartners.filter((t) => t.offers === wantCode && t.wants !== speak);
  const byOnline = (a: TandemPartner, b: TandemPartner) => Number(b.online) - Number(a.online);
  const sameLanguage = speak === wantCode;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Tandem</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Swap languages with a native speaker.</h1>
        <p className="mt-2 text-sm opacity-90">You help them with your language, they help you with Norwegian. Nicknames only.</p>
      </section>

      <Card className="flex flex-col gap-3">
        <LanguageSelect id="speak" label="I speak" value={speak} onChange={setSpeakCode} />
        <LanguageSelect id="want" label="I want to practise" value={wantCode} onChange={setWantCode} />
        {sameLanguage && <p className="text-sm font-semibold text-danger">Pick two different languages.</p>}
      </Card>

      {!sameLanguage && (
        <section>
          <SectionTitle action={<Badge tone="muted">Sample partners</Badge>}>Your matches</SectionTitle>
          {perfect.length + good.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="text-4xl" aria-hidden>
                🔭
              </div>
              <p className="font-bold">No partners for this pair yet</p>
              <p className="max-w-xs text-sm text-muted">Try practising Norwegian, or meet people in real life at a språkkafé.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {wantCode !== "nb" && <Button onClick={() => setWantCode("nb")}>Practise Norwegian</Button>}
                <Button href="/events" variant="secondary">
                  🧇 Find a språkkafé
                </Button>
              </div>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...perfect].sort(byOnline).map((t) => (
                <li key={t.id}>
                  <PartnerCard partner={t} perfect onChat={() => setPartner(t)} />
                </li>
              ))}
              {perfect.length > 0 && good.length > 0 && (
                <li className="pt-2 text-sm font-semibold text-muted">More {LANGUAGE_NAMES[wantCode]} speakers</li>
              )}
              {[...good].sort(byOnline).map((t) => (
                <li key={t.id}>
                  <PartnerCard partner={t} perfect={false} onChat={() => setPartner(t)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <PrivacyNote />
    </div>
  );
}

function LanguageSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
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
        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

function PartnerCard({ partner, perfect, onChat }: { partner: TandemPartner; perfect: boolean; onChat: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl" aria-hidden>
          {partner.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{partner.nickname}</p>
            {perfect && <Badge tone="success">✨ Perfect match</Badge>}
          </div>
          <p className="text-sm text-muted">
            Speaks {LANGUAGE_NAMES[partner.offers] ?? partner.offers} · learning {LANGUAGE_NAMES[partner.wants] ?? partner.wants} ({partner.level})
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <span className={`h-2 w-2 rounded-full ${partner.online ? "bg-success" : "bg-muted"}`} aria-hidden />
            {partner.online ? "Online now" : "Offline · replies later"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {partner.interests.map((i) => (
          <span key={i} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold">
            {i}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onChat} aria-label={`Chat with ${partner.nickname}`}>
          💬 Say hi
        </Button>
        <Button variant="secondary" disabled aria-label="Avatar video call, coming soon">
          📹 Call · soon
        </Button>
      </div>
    </Card>
  );
}

function PrivacyNote() {
  return (
    <Card className="flex flex-col gap-2 bg-surface-2 text-sm">
      <p className="font-bold">🔒 Safe by design</p>
      <ul className="list-inside list-disc space-y-1 text-muted">
        <li>Nicknames and avatars only: no real names, photos or faces.</li>
        <li>Don&apos;t share your phone number, email, address or social media. Snakk warns you if you try.</li>
        <li>Someone makes you uncomfortable? Tap «Report» in the chat.</li>
      </ul>
    </Card>
  );
}

// ---------------- chat ----------------

interface ChatMessage {
  id: number;
  from: "me" | "partner";
  text: string;
  /** Partner line in English (tap to show). */
  en?: string;
  correction?: { corrected: string; why: string };
}

function Chat({ partner, myLanguage, onBack }: { partner: TandemPartner; myLanguage: string; onBack: () => void }) {
  const script = useMemo(() => partnerScript(partner, myLanguage), [partner, myLanguage]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState(1); // next script line to send (line 0 opens the chat)
  const [typing, setTyping] = useState(true);
  const [draft, setDraft] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reported, setReported] = useState(false);
  const [showEn, setShowEn] = useState<Record<number, boolean>>({});
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function partnerSays(line: ScriptLine, delay: number) {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: ++seq.current, from: "partner", text: line.no, en: line.en }]);
    }, delay);
    timers.current.push(t);
  }

  // The partner opens the chat (Chat is remounted per partner, so this runs once).
  useEffect(() => {
    const t = setTimeout(() => {
      setTyping(false);
      setMessages([{ id: ++seq.current, from: "partner", text: script[0].no, en: script[0].en }]);
    }, 900);
    timers.current.push(t);
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per partner
  }, [partner.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [messages.length, typing]);

  const lastPartnerLine = step - 1 >= 0 && step - 1 < script.length ? script[step - 1] : null;
  const suggestions = !typing && lastPartnerLine ? lastPartnerLine.suggestions : [];

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim().slice(0, MAX_LEN);
    if (!text || sending || typing) return;
    const unsafe = contactInfoWarning(text);
    if (unsafe) {
      setWarning(`For your safety, don't share ${unsafe} in Tandem. Keep it to the language!`);
      return;
    }
    setWarning(null);
    setDraft("");
    setMessages((m) => [...m, { id: ++seq.current, from: "me", text, correction: correct(text) ?? undefined }]);

    setSending(true);
    // The server decides the XP (2 per message, capped per day) and unlocks "New buddy".
    progressActions
      .send({ type: "tandem_message_sent" })
      .catch(() => {})
      .finally(() => setSending(false));

    const line = step < script.length ? script[step] : PARTNER_FILLERS[(step - script.length) % PARTNER_FILLERS.length];
    setStep((s) => s + 1);
    partnerSays(line, partner.online ? 1400 + Math.min(1500, line.no.length * 20) : 2500);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back to matches" className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-lg">
          ←
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-2xl" aria-hidden>
          {partner.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{partner.nickname}</p>
          <p className="text-xs font-semibold text-muted">
            {typing ? "typing…" : partner.online ? "● Online" : "Offline · replies later"} · Sample partner
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReported(true)}
          disabled={reported}
          className="h-11 rounded-full px-3 text-sm font-semibold text-danger disabled:text-muted"
        >
          {reported ? "Reported ✓" : "🚩 Report"}
        </button>
      </div>

      {reported && (
        <Card className="bg-surface-2 text-sm text-muted" role="status">
          Thanks for telling us. In the real app a moderator checks reports, and you can block this person. You can leave the chat any time.
        </Card>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-3" aria-live="polite" aria-label={`Chat with ${partner.nickname}`}>
        {messages.map((m) => (
          <Message key={m.id} m={m} showEn={!!showEn[m.id]} onToggleEn={() => setShowEn((s) => ({ ...s, [m.id]: !s[m.id] }))} />
        ))}
        {typing && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="text-xl" aria-hidden>
              {partner.avatar}
            </span>
            <span className="rounded-2xl bg-surface px-4 py-2 shadow-sm">
              <span className="animate-pulse">•••</span>
              <span className="sr-only">{partner.nickname} is typing</span>
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer: sticks above the bottom nav on phones */}
      <div className="sticky bottom-24 z-10 flex flex-col gap-2 rounded-3xl border border-line bg-surface p-3 shadow-lg md:bottom-4">
        {suggestions.length > 0 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Reply ideas">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft(s)}
                className="h-11 shrink-0 whitespace-nowrap rounded-full bg-brand-soft px-4 text-sm font-semibold text-brand"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {warning && (
          <p className="rounded-2xl bg-warn-soft px-3 py-2 text-sm font-semibold text-warn" role="alert">
            ⚠️ {warning}
          </p>
        )}
        <form onSubmit={send} className="flex items-center gap-2">
          <label htmlFor="tandem-input" className="sr-only">
            Message in Norwegian
          </label>
          <input
            id="tandem-input"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (warning) setWarning(null);
            }}
            maxLength={MAX_LEN}
            autoComplete="off"
            placeholder="Skriv på norsk…"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-base focus:border-brand focus:outline-none"
          />
          <Button type="submit" disabled={!draft.trim() || typing} aria-label="Send">
            ➤
          </Button>
        </form>
        <p className="px-1 text-xs text-muted">
          +2 XP per message ·{" "}
          <Link href="/phrases?register=informal" className="font-semibold text-brand">
            need a phrase?
          </Link>
        </p>
      </div>
    </div>
  );
}

function Message({ m, showEn, onToggleEn }: { m: ChatMessage; showEn: boolean; onToggleEn: () => void }) {
  if (m.from === "me") {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand px-4 py-3 text-brand-ink">{m.text}</p>
        {m.correction && (
          <div className="max-w-[85%] rounded-2xl border border-success bg-success-soft px-3 py-2 text-sm">
            <p className="font-bold text-success">✏️ Small fix</p>
            <p className="font-semibold">«{m.correction.corrected}»</p>
            <p className="text-xs text-muted">{m.correction.why}</p>
          </div>
        )}
      </div>
    );
  }
  const used = phrasesUsed(m.text);
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="max-w-[85%] rounded-3xl rounded-bl-lg border border-line bg-surface px-4 py-3 shadow-sm">
        <p lang="nb">{m.text}</p>
        {showEn && m.en && <p className="mt-1 border-t border-line pt-1 text-sm text-muted">{m.en}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {m.en && (
          <button type="button" onClick={onToggleEn} aria-pressed={showEn} className="h-11 rounded-full px-2 text-xs font-semibold text-muted underline">
            {showEn ? "Hide English" : "Show in English"}
          </button>
        )}
        {used.map((ph) => (
          <Link key={ph.id} href={`/phrases?id=${ph.id}`} className="inline-flex h-11 items-center rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand">
            📖 {ph.text}
          </Link>
        ))}
      </div>
    </div>
  );
}
