"use client";
/**
 * After the meeting: "turn the meeting into a lesson". Owner: T8.
 * Connects Tolk to the rest of Snakk: phrases from the meeting → phrasebook, the matching scenario → speak tutor.
 * Nothing is saved: the transcript is gone when you leave the page.
 */
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, RegisterTag, SectionTitle } from "@/components/ui";
import { getScenario, phrases } from "@/lib/content";
import type { Phrase } from "@/lib/content/types";
import type { TolkLanguage, TolkSetting, TolkTurn } from "./tolk-data";

/** Lowercase, keep letters (incl. æøå) and digits. */
function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Phrasebook phrases that were used in the Norwegian side of the meeting. */
export function phrasesInText(norwegian: string[]): Phrase[] {
  const text = words(norwegian.join(" ")).join(" ");
  const tokens = new Set(text.split(" "));
  return phrases.filter((ph) => {
    const variants = ph.text
      .replace(/\([^)]*\)/g, "")
      .replace(/…/g, "")
      .split("/")
      .map((v) => v.trim())
      .filter(Boolean);
    return variants.some((v) => {
      const prefix = v.endsWith("-");
      const w = words(v.replace(/-$/, "")).join(" ");
      if (w.length < 3) return false; // too short to match reliably ("du")
      if (w.includes(" ")) return text.includes(w);
      if (prefix) return [...tokens].some((t) => t.startsWith(w) && t.length > w.length);
      return tokens.has(w);
    });
  });
}

export function TolkSummary({
  turns,
  langA,
  langB,
  setting,
  isDemo,
  onRestart,
}: {
  turns: TolkTurn[];
  langA: TolkLanguage;
  langB: TolkLanguage;
  setting: TolkSetting;
  isDemo: boolean;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const scenario = setting.practiseScenarioId ? getScenario(setting.practiseScenarioId) : undefined;

  // Norwegian lines: what the Norwegian speaker said, and what Tolk said in Norwegian.
  const nbSide = langA.code === "nb" ? "a" : langB.code === "nb" ? "b" : null;
  const norwegianLines = nbSide
    ? turns.map((t) => (t.speaker === nbSide ? t.original : t.speaker === "unknown" ? `${t.original} ${t.translation}` : t.translation))
    : [];
  const found = phrasesInText(norwegianLines);

  async function copy() {
    const lines = turns.map((t) => {
      const who = t.speaker === "a" ? langA.name : t.speaker === "b" ? langB.name : "Speaker";
      return `${who}: ${t.original}\n→ ${t.translation}`;
    });
    try {
      await navigator.clipboard.writeText(`Snakk Tolk · ${setting.title}\n\n${lines.join("\n\n")}`);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">
          {setting.emoji} {setting.title}
          {isDemo && " · demo"}
        </p>
        <h1 className="mt-1 text-3xl font-black leading-tight">{turns.length > 0 ? "Meeting done. Nice work!" : "Session ended"}</h1>
        <p className="mt-2 text-sm opacity-90">
          {turns.length} {turns.length === 1 ? "thing was" : "things were"} interpreted between {langA.name} and {langB.name}.
        </p>
      </section>

      {turns.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-4xl" aria-hidden>
            🤫
          </div>
          <p className="font-bold">Nothing was interpreted</p>
          <p className="max-w-xs text-sm text-muted">Speak after «Listening…» appears, and pause briefly when you&apos;re done so Tolk knows it&apos;s its turn.</p>
          <Button onClick={onRestart}>Try again</Button>
        </Card>
      ) : (
        <>
          {/* Turn the meeting into a lesson */}
          {nbSide && (
            <section>
              <SectionTitle>Learn from this meeting</SectionTitle>
              <div className="flex flex-col gap-3">
                {found.length > 0 ? (
                  found.map((ph) => (
                    <Link
                      key={ph.id}
                      href={`/phrases?id=${ph.id}`}
                      className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="font-bold">{ph.text}</p>
                        <p className="truncate text-sm text-muted">{ph.meaning}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RegisterTag register={ph.register} />
                        <span aria-hidden className="text-brand">
                          →
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <Card className="text-sm text-muted">No phrasebook phrases came up this time. Browse phrases for this kind of meeting below.</Card>
                )}
                <Button href={setting.id === "everyday" ? "/phrases?register=informal" : "/phrases?register=formal"} variant="secondary">
                  💬 {setting.id === "everyday" ? "Everyday phrases" : "Polite phrases for meetings"}
                </Button>
              </div>
            </section>
          )}

          {scenario && (
            <section>
              <SectionTitle>Next time, try it yourself</SectionTitle>
              <Card className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-4xl" aria-hidden>
                  {scenario.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{scenario.title}</p>
                    <Badge tone="brand">{scenario.level}</Badge>
                  </div>
                  <p className="text-sm text-muted">Practise this conversation with the voice tutor.</p>
                </div>
                <Button href={`/speak?scenario=${scenario.id}`} variant="accent" aria-label={`Practise ${scenario.title}`}>
                  🎙️
                </Button>
              </Card>
            </section>
          )}

          {/* Transcript */}
          <section>
            <SectionTitle
              action={
                <button type="button" onClick={copy} className="h-11 px-2 text-sm font-semibold text-brand">
                  {copied === "done" ? "✓ Copied" : copied === "failed" ? "Couldn't copy" : "📋 Copy"}
                </button>
              }
            >
              Transcript
            </SectionTitle>
            <ol className="flex flex-col gap-3">
              {turns.map((t) => (
                <li key={t.id} className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
                  <p className="text-xs font-semibold text-muted">
                    {t.speaker === "a" ? langA.name : t.speaker === "b" ? langB.name : "Speaker"}
                  </p>
                  <p className="mt-1 font-semibold" dir="auto">
                    {t.original}
                  </p>
                  <p className="mt-1 text-sm text-muted" dir="auto">
                    → {t.translation}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">🔒 Not saved anywhere. The transcript disappears when you leave this page.</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onRestart}>New conversation</Button>
            <Button href="/learn" variant="secondary">
              Back home
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
