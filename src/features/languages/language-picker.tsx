"use client";
/**
 * First-visit language choice: "I speak …" and "I want to learn …".
 * Only English and Norwegian can be picked today; other languages show as "coming soon".
 * Opens by itself once per browser (landing page and app), and again via openLanguagePicker().
 * The choice is saved in the signed progress through the `languages_set` event (no XP).
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Mascot } from "@/components/mascot";
import { Badge, Button } from "@/components/ui";
import { AVAILABLE_LANGUAGES, LANGUAGE_OPTIONS, type AvailableLanguage } from "@/lib/content";
import { progressActions, useProgress } from "@/lib/progress/store";

// Per-browser "already asked" flag: a UI convenience only, the languages themselves live in the progress token.
const SEEN_KEY = "snakk.languages.asked.v1";

const openers = new Set<() => void>();
/** Open the language picker from anywhere (e.g. a "change" button). */
export function openLanguagePicker() {
  openers.forEach((open) => open());
}

function asAvailable(code: string, fallback: AvailableLanguage): AvailableLanguage {
  return (AVAILABLE_LANGUAGES as readonly string[]).includes(code) ? (code as AvailableLanguage) : fallback;
}

const other = (code: AvailableLanguage): AvailableLanguage => (code === "nb" ? "en" : "nb");

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // private mode: we'll just ask again next time
  }
}

export function LanguageWelcome() {
  const p = useProgress();
  const dialog = useRef<HTMLDialogElement>(null);
  const [native, setNative] = useState<AvailableLanguage>("en");
  // Connection with the rest of the app: a native language the picker can't show yet (e.g. Spanish from
  // the placement test) is kept unless the learner picks one here on purpose.
  const [nativeTouched, setNativeTouched] = useState(false);
  const keepNative = !nativeTouched && !(AVAILABLE_LANGUAGES as readonly string[]).includes(p.nativeLanguage) ? p.nativeLanguage : null;
  const keptName = keepNative ? LANGUAGE_OPTIONS.find((l) => l.code === keepNative)?.nativeName ?? keepNative : null;
  const [target, setTarget] = useState<AvailableLanguage>("nb");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const open = useCallback(() => {
    const n = asAvailable(p.nativeLanguage, "en");
    const t = asAvailable(p.targetLanguage, "nb");
    setNative(n);
    setTarget(t === n ? other(n) : t);
    setNativeTouched(false);
    setError(null);
    dialog.current?.showModal();
  }, [p.nativeLanguage, p.targetLanguage]);

  useEffect(() => {
    openers.add(open);
    return () => {
      openers.delete(open);
    };
  }, [open]);

  // First visit in this browser: ask straight away.
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    // Someone who already has progress (e.g. finished the placement test) has told us their language.
    let hasProgress = false;
    try {
      hasProgress = Boolean(window.localStorage.getItem("snakk.progress.token.v1"));
    } catch {
      hasProgress = false;
    }
    if (hasProgress) markSeen();
    else if (!seen) dialog.current?.showModal();
  }, []);

  // Picking the same language on both sides flips the other one, so the pair is always valid.
  function pickNative(code: AvailableLanguage) {
    setNativeTouched(true);
    setNative(code);
    if (code === target) setTarget(other(code));
  }
  function pickTarget(code: AvailableLanguage) {
    setTarget(code);
    if (code === native) setNative(other(code));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await progressActions.send({ type: "languages_set", nativeLanguage: keepNative ?? native, targetLanguage: target });
      markSeen();
      dialog.current?.close();
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      // Closing with Esc keeps the defaults and doesn't ask again.
      onCancel={markSeen}
      className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[2rem] border-2 border-line bg-surface p-0 text-ink shadow-[0_6px_0_var(--line)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Mascot className="h-16 w-16 shrink-0" />
          <div>
            <p className="font-display text-lg font-medium text-muted">Hei! 👋 Velkommen!</p>
            <h2 id={titleId} className="text-2xl font-bold leading-tight">
              Let&apos;s set up your languages
            </h2>
          </div>
        </div>

        <LanguageGroup label="I speak" value={keepNative ? null : native} onPick={pickNative} />
        {keptName && (
          <p className="-mt-3 text-sm text-muted">
            You speak <span className="font-semibold text-ink">{keptName}</span> (from your profile). We&apos;ll keep it unless you pick one above.
          </p>
        )}
        <LanguageGroup label="I want to learn" value={target} onPick={pickTarget} />

        {target === "en" && (
          <p className="rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">
            🇬🇧 English lessons are just getting started. Tandem and Tolk already work, and more is on the way!
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm font-semibold text-danger">
            ⚠️ {error}
          </p>
        )}

        <Button size="lg" onClick={save} disabled={saving} aria-busy={saving} className="w-full">
          {saving ? "Saving…" : "Let's go! →"}
        </Button>
        <p className="-mt-3 text-center text-xs text-muted">You can change this any time from Home.</p>
      </div>
    </dialog>
  );
}

function LanguageGroup({ label, value, onPick }: { label: string; value: AvailableLanguage | null; onPick: (code: AvailableLanguage) => void }) {
  const available = LANGUAGE_OPTIONS.filter((l) => l.available);
  const soon = LANGUAGE_OPTIONS.filter((l) => !l.available);
  return (
    <fieldset>
      <legend className="mb-2 font-display text-lg font-semibold">{label}</legend>
      <div className="grid grid-cols-2 gap-3">
        {available.map((l) => {
          const active = l.code === value;
          return (
            <button
              key={l.code}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(l.code as AvailableLanguage)}
              className={`relative flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                active ? "border-brand bg-brand-soft shadow-[0_4px_0_var(--brand-deep)]" : "border-line bg-surface shadow-[0_4px_0_var(--line)] hover:-translate-y-0.5"
              }`}
            >
              <span className="text-3xl" aria-hidden>
                {l.flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-tight">{l.nativeName}</span>
                {l.nativeName !== l.name && <span className="block text-xs text-muted">{l.name}</span>}
              </span>
              {active && (
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-brand text-sm font-bold text-brand-ink" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="More languages coming soon">
        {soon.map((l) => (
          <span key={l.code} className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-line px-2.5 py-1 text-xs font-semibold text-muted opacity-75" title={`${l.name}: coming soon`}>
            <span aria-hidden>{l.flag}</span> {l.nativeName}
          </span>
        ))}
        <Badge tone="warn">🚧 Coming soon</Badge>
      </div>
    </fieldset>
  );
}
