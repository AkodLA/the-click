"use client";
/**
 * Phrasebook (/phrases): search + register chips + level chips + learned filter over every phrase.
 * Owner: T7.
 *
 * Filters live in the URL, so any screen can link straight into a view:
 *   /phrases?register=slang      /phrases?level=A2      /phrases?show=learned
 *   /phrases?q=hei               /phrases?id=digg   (opens and highlights one phrase)
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Card } from "@/components/ui";
import { CEFR_LEVELS, phrases, REGISTER_STYLE } from "@/lib/content";
import type { CefrLevel, Phrase, Register } from "@/lib/content/types";
import { useProgress } from "@/lib/progress/store";
import { PhraseCard } from "./phrase-card";

const REGISTERS: Register[] = ["slang", "informal", "neutral", "formal"];
const SHOW = ["all", "new", "learned"] as const;
type Show = (typeof SHOW)[number];
const SHOW_LABEL: Record<Show, string> = { all: "All", new: "To learn", learned: "✓ Learned" };

/** Lowercase and strip accents so "skjera" finds "Skjer'a?" and "lurer pa" finds "lurer på". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "");
}

function haystack(ph: Phrase): string {
  return norm([ph.text, ph.meaning, ph.example.no, ph.example.en, ...ph.sayInstead, ...(ph.tags ?? []), ph.region ?? ""].join(" "));
}

const SEARCH_INDEX = new Map(phrases.map((ph) => [ph.id, haystack(ph)]));

function isRegister(v: string | null): v is Register {
  return v !== null && (REGISTERS as string[]).includes(v);
}
function isLevel(v: string | null): v is CefrLevel {
  return v !== null && (CEFR_LEVELS as readonly string[]).includes(v);
}

export function Phrasebook() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const p = useProgress();

  const q = params.get("q") ?? "";
  const register = isRegister(params.get("register")) ? (params.get("register") as Register) : null;
  const level = isLevel(params.get("level")) ? (params.get("level") as CefrLevel) : null;
  const show: Show = (SHOW as readonly string[]).includes(params.get("show") ?? "") ? (params.get("show") as Show) : "all";
  const focusId = params.get("id");

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "id") next.delete("id");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // The search box types into local state (instant) and updates the URL a moment later.
  const [query, setQuery] = useState(q);
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => setParam("q", query.trim() ? query : null), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [query]);

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  const levelsInUse = useMemo(() => CEFR_LEVELS.filter((l) => phrases.some((ph) => ph.level === l)), []);

  const results = useMemo(() => {
    const terms = norm(query).split(" ").filter(Boolean);
    return phrases.filter((ph) => {
      if (focusId && ph.id === focusId) return true; // a deep-linked phrase is always shown
      if (register && ph.register !== register) return false;
      if (level && ph.level !== level) return false;
      const learned = p.learnedPhraseIds.includes(ph.id);
      if (show === "learned" && !learned) return false;
      if (show === "new" && learned) return false;
      const text = SEARCH_INDEX.get(ph.id) ?? "";
      return terms.every((t) => text.includes(t));
    });
  }, [query, register, level, show, focusId, p.learnedPhraseIds]);

  // Deep link: scroll the requested phrase into view once.
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`phrase-${focusId}`);
    el?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [focusId]);

  const learnedCount = phrases.filter((ph) => p.learnedPhraseIds.includes(ph.id)).length;
  const filtersOn = Boolean(query || register || level || show !== "all");
  const countFor = (r: Register) => phrases.filter((ph) => ph.register === r).length;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Phrasebook</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Say it like a local.</h1>
        <p className="mt-2 text-sm opacity-90">Real spoken Norwegian, with when to use it, when not to, and what to say instead.</p>
        <Link href="/words" className="mt-3 inline-flex h-11 items-center rounded-full bg-white/20 px-4 text-sm font-bold">
          🧠 Words for your work and interests →
        </Link>
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round((learnedCount / phrases.length) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs opacity-80">
            {learnedCount} of {phrases.length} phrases in your vocabulary
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <label htmlFor="phrase-search" className="sr-only">
          Search phrases
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
          🔍
        </span>
        <input
          id="phrase-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          maxLength={60}
          placeholder="Search «hei», “thanks”, greeting…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-base shadow-sm placeholder:text-muted focus:border-brand focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <ChipRow label="Register">
          <Chip active={!register} onClick={() => setParam("register", null)}>
            All
          </Chip>
          {REGISTERS.map((r) => (
            <Chip key={r} active={register === r} onClick={() => setParam("register", register === r ? null : r)} className={register === r ? "" : REGISTER_STYLE[r].className}>
              {REGISTER_STYLE[r].label} <span className="opacity-70">{countFor(r)}</span>
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Level">
          <Chip active={!level} onClick={() => setParam("level", null)}>
            All
          </Chip>
          {levelsInUse.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setParam("level", level === l ? null : l)}>
              {l}
            </Chip>
          ))}
          {p.cefr && levelsInUse.includes(p.cefr) && level !== p.cefr && (
            <Chip active={false} onClick={() => setParam("level", p.cefr)}>
              ⭐ My level ({p.cefr})
            </Chip>
          )}
        </ChipRow>
        <ChipRow label="Show">
          {SHOW.map((s) => (
            <Chip key={s} active={show === s} onClick={() => setParam("show", s === "all" ? null : s)}>
              {SHOW_LABEL[s]}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-muted" aria-live="polite">
          {results.length} {results.length === 1 ? "phrase" : "phrases"}
        </p>
        {filtersOn && (
          <button type="button" onClick={clearAll} className="h-11 px-2 font-semibold text-brand">
            Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState show={show} onClear={clearAll} />
      ) : (
        <ul className="flex flex-col gap-4">
          {results.map((ph) => (
            <li key={ph.id}>
              <PhraseCard phrase={ph} collapsible defaultOpen={ph.id === focusId} highlight={ph.id === focusId} />
            </li>
          ))}
        </ul>
      )}

      {learnedCount > 0 && learnedCount === phrases.length && (
        <Card className="text-center">
          <p className="text-3xl" aria-hidden>
            🎉
          </p>
          <p className="mt-1 font-bold">You know every phrase in the book!</p>
          <p className="text-sm text-muted">Now use them out loud with the tutor.</p>
          <Button href="/speak" className="mt-3">
            🎙️ Start speaking
          </Button>
        </Card>
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {children}
    </div>
  );
}

function Chip({ active, onClick, className = "", children }: { active: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
        active ? "bg-ink text-bg" : `border border-line bg-surface hover:bg-surface-2 ${className}`
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ show, onClear }: { show: Show; onClear: () => void }) {
  const learnedEmpty = show === "learned";
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="text-5xl" aria-hidden>
        {learnedEmpty ? "📒" : "🤔"}
      </div>
      <p className="font-bold">{learnedEmpty ? "No phrases learned yet" : "No phrases match"}</p>
      <p className="max-w-xs text-sm text-muted">
        {learnedEmpty ? "Tap «I've got it» on a phrase to add it to your vocabulary and earn XP." : "Try another word, or clear the filters to see everything."}
      </p>
      <Button variant="secondary" onClick={onClear}>
        {learnedEmpty ? "Browse all phrases" : "Clear filters"}
      </Button>
    </Card>
  );
}

/** Shown while the URL filters load (the page is prerendered, filters are read in the browser). */
export function PhrasebookSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading phrases">
      <div className="h-40 animate-pulse rounded-3xl bg-surface-2" />
      <div className="h-12 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-11 animate-pulse rounded-full bg-surface-2" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-3xl bg-surface-2" />
      ))}
    </div>
  );
}
