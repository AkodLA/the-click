"use client";
/**
 * Events (/events): språkkafé and language meetups. Owner: T11.
 * Check-in sends `event_checkin`; the SERVER gives the XP (once per event) and the "Café regular" badge.
 * All events are SAMPLE DATA (isSample). Roadmap: a daily agent finds real events, and a QR code at the café proves presence.
 */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { CEFR_LEVELS, languageEvents } from "@/lib/content";
import type { CefrLevel, LanguageEvent } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";

/** Events have no end time in the data: assume 2 hours. Check-in opens 30 minutes before. */
const DURATION_MS = 2 * 60 * 60 * 1000;
const EARLY_MS = 30 * 60 * 1000;
const TZ = "Europe/Oslo";

type When = "live" | "today" | "upcoming" | "past";

function whenOf(ev: LanguageEvent, now: number): When {
  const start = Date.parse(ev.startsAt);
  if (now > start + DURATION_MS) return "past";
  if (now >= start - EARLY_MS) return "live";
  const day = (d: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
  return day(start) === day(now) ? "today" : "upcoming";
}

function dateParts(iso: string) {
  const d = new Date(iso);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o }).format(d);
  return { weekday: f({ weekday: "short" }), day: f({ day: "numeric" }), month: f({ month: "short" }), time: f({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) };
}

/** Minimal .ics so the learner can put it in their own calendar. Runs only in the browser; nothing is sent anywhere. */
function downloadIcs(ev: LanguageEvent) {
  const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = Date.parse(ev.startsAt);
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Snakk//Events//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@snakk`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + DURATION_MS)}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(`${ev.place}, ${ev.area}`)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EventsView() {
  const p = useProgress();
  const [levelFilter, setLevelFilter] = useState<CefrLevel | "all" | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Time-dependent labels only after mount (the page is prerendered without a clock).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const level = levelFilter ?? (p.cefr ?? "all");
  const sorted = [...languageEvents].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const matching = sorted.filter((ev) => level === "all" || ev.levels.includes(level));
  const upcoming = matching.filter((ev) => now === null || whenOf(ev, now) !== "past");
  const past = now === null ? [] : matching.filter((ev) => whenOf(ev, now) === "past");
  const checkedIn = p.checkedInEventIds.length;
  const hasBadge = p.unlocked.includes("sprakkafe");

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Språkkafé & events</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Practise in real life.</h1>
        <p className="mt-2 text-sm opacity-90">Free language cafés and meetups. Check in when you&apos;re there to earn XP.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-white/20 px-3 py-1">📍 {checkedIn} checked in</span>
          <span className="rounded-full bg-white/20 px-3 py-1">{hasBadge ? "🧇 Café regular ✓" : "🧇 Badge: check in once"}</span>
        </div>
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by level">
        <Chip active={level === "all"} onClick={() => setLevelFilter("all")}>
          All levels
        </Chip>
        {CEFR_LEVELS.map((l) => (
          <Chip key={l} active={level === l} onClick={() => setLevelFilter(l)}>
            {l}
            {l === p.cefr && <span aria-label="your level"> ⭐</span>}
          </Chip>
        ))}
      </div>

      {!p.cefr && (
        <p className="-mt-3 text-sm text-muted">
          <Link href="/onboarding" className="font-semibold text-brand">
            Find your level
          </Link>{" "}
          to see the events that fit you.
        </p>
      )}

      <section>
        <SectionTitle action={<Badge tone="warn">Sample events</Badge>}>Coming up</SectionTitle>
        {upcoming.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-4xl" aria-hidden>
              🗓️
            </div>
            <p className="font-bold">No events for {level === "all" ? "now" : `level ${level}`}</p>
            <p className="max-w-xs text-sm text-muted">Try all levels, or practise speaking with the tutor until the next one.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {level !== "all" && <Button onClick={() => setLevelFilter("all")}>Show all levels</Button>}
              <Button href="/speak" variant="secondary">
                🎙️ Practise speaking
              </Button>
            </div>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {upcoming.map((ev) => (
              <li key={ev.id}>
                <EventCard ev={ev} when={now === null ? null : whenOf(ev, now)} myLevel={p.cefr} checkedIn={p.checkedInEventIds.includes(ev.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <button type="button" onClick={() => setShowPast((s) => !s)} aria-expanded={showPast} className="h-11 text-sm font-semibold text-brand">
            {showPast ? "Hide past events" : `Show past events (${past.length})`}
          </button>
          {showPast && (
            <ul className="mt-2 flex flex-col gap-4 opacity-70">
              {past.map((ev) => (
                <li key={ev.id}>
                  <EventCard ev={ev} when="past" myLevel={p.cefr} checkedIn={p.checkedInEventIds.includes(ev.id)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Get ready: connects real-life practice to the rest of the app */}
      <Card className="flex flex-col gap-3">
        <p className="font-bold">☕ Get ready for your first språkkafé</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <PrepLink href="/speak?scenario=party" emoji="🎉" title="Small talk" detail="Practise with the tutor" />
          <PrepLink href="/phrases?id=takk-for-sist" emoji="💬" title="«Takk for sist!»" detail="Say it next time" />
          <PrepLink href="/tandem" emoji="🤝" title="Tandem" detail="Warm up in a chat" />
          <PrepLink href="/league" emoji="🏆" title="League" detail="Check-ins give big XP" />
        </div>
      </Card>

      <Card className="flex flex-col gap-2 bg-surface-2 text-sm">
        <p className="font-bold">🗺️ Coming next</p>
        <p className="text-muted">
          These events are examples. In the full app a daily agent finds real språkkafés from libraries and volunteer centres, and you check in by
          scanning a QR code at the table, so XP can&apos;t be earned from the sofa.
        </p>
      </Card>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
        active ? "bg-ink text-bg" : "border border-line bg-surface hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

function EventCard({ ev, when, myLevel, checkedIn }: { ev: LanguageEvent; when: When | null; myLevel: CefrLevel | null; checkedIn: boolean }) {
  const d = dateParts(ev.startsAt);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const fitsMe = myLevel !== null && ev.levels.includes(myLevel);

  async function checkIn() {
    setSaving(true);
    try {
      await progressActions.send({ type: "event_checkin", eventId: ev.id });
      setConfirming(false);
    } catch {
      // The store already showed an error toast; the button stays so they can retry.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={`flex flex-col gap-4 ${when === "live" ? "ring-4 ring-accent/30" : ""}`}>
      <div className="flex gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent-soft py-2 text-accent">
          <span className="text-xs font-bold uppercase">{d.weekday}</span>
          <span className="text-2xl font-black leading-none">{d.day}</span>
          <span className="text-xs font-bold uppercase">{d.month}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {when === "live" && <Badge tone="accent">🔴 Happening now</Badge>}
            {when === "today" && <Badge tone="warn">Today</Badge>}
            {fitsMe && <Badge tone="success">✓ Your level</Badge>}
          </div>
          <p className="mt-1 font-bold leading-tight">{ev.title}</p>
          <p className="text-sm text-muted">
            🕐 {d.time} · 📍 {ev.place}, {ev.area}
          </p>
        </div>
      </div>

      <p className="text-sm">{ev.description}</p>

      <div className="flex flex-wrap items-center gap-2">
        {ev.levels.map((l) => (
          <Badge key={l} tone={l === myLevel ? "brand" : "muted"}>
            {l}
          </Badge>
        ))}
        <Badge tone="accent">+{ev.xpReward} XP</Badge>
        {ev.isSample && <Badge tone="warn">Sample</Badge>}
      </div>

      {checkedIn ? (
        <div className="flex h-11 items-center justify-center rounded-2xl border border-success bg-success-soft font-semibold text-success" role="status">
          ✓ Checked in. Takk for at du kom!
        </div>
      ) : when === "past" ? null : confirming ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
          <p className="text-sm font-semibold">Are you at «{ev.title}» right now?</p>
          <p className="text-xs text-muted">Check in only when you&apos;re there. (Soon: scan the QR code at the table.)</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="accent" onClick={checkIn} disabled={saving}>
              {saving ? "Checking in…" : "📍 Yes, I'm here"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>
              Not yet
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant={when === "live" ? "accent" : "primary"} onClick={() => setConfirming(true)}>
            📍 Check in
          </Button>
          <Button variant="secondary" onClick={() => downloadIcs(ev)} aria-label={`Add ${ev.title} to your calendar`}>
            📅 Calendar
          </Button>
        </div>
      )}
    </Card>
  );
}

function PrepLink({ href, emoji, title, detail }: { href: string; emoji: string; title: string; detail: string }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface p-3 transition hover:bg-surface-2">
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-bold">{title}</span>
        <span className="text-xs text-muted">{detail}</span>
      </span>
    </Link>
  );
}
