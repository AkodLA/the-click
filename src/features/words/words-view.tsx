"use client";
/**
 * My words (/words), T20: vocabulary packs picked for YOU (age group, field, interests) at your level,
 * with listen, translate (T19), say-it (T5), "I know it" (server XP) and spaced review.
 *   /words?pack=logistics   open one pack     /words?review=1   start a review
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, ProgressBar, RegisterTag, SectionTitle } from "@/components/ui";
import { AboutYou } from "@/features/personal/about-you";
import { PronunciationCheck } from "@/features/pronunciation/pronunciation-check";
import { SeasonBanner } from "@/features/engagement/season-banner";
import { ExplainText } from "@/features/explain/explain-text";
import { FieldTest } from "./field-test";
import { TranslateButton } from "@/features/translate/translate-button";
import { CEFR_LEVELS, getPack, getVocabWord, packFitsAge, vocabPacks } from "@/lib/content";
import type { CefrLevel, VocabPack, VocabWord } from "@/lib/content/types";
import { hasPrefs, usePrefs } from "@/lib/personal/prefs";
import { answerReview, dueIds, nextDueInDays, startReview, useReview } from "@/lib/personal/review";
import { progressActions, useProgress } from "@/lib/progress/store";
import { speakNorwegian } from "@/lib/speech";

/** "My level" shows words up to one level above yours. */
function fitsLevel(w: VocabWord, cefr: CefrLevel | null) {
  if (!cefr) return true;
  return CEFR_LEVELS.indexOf(w.level) <= CEFR_LEVELS.indexOf(cefr) + 1;
}

export function WordsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const p = useProgress();
  const prefs = usePrefs();
  const review = useReview();
  const [editing, setEditing] = useState(false);
  const [skipSetup, setSkipSetup] = useState(false);
  const [allLevels, setAllLevels] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  // Clock only after mount (the page is prerendered).
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const known = useMemo(() => new Set(p.learnedWordIds ?? []), [p.learnedWordIds]);
  const due = now === null ? [] : dueIds(review, now).filter((id) => getVocabWord(id));
  const openPack = getPack(params.get("pack") ?? "");
  const reviewing = params.get("review") === "1";

  const go = (qs: string) => {
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  // Packs for you: your field first, then your interests; everything else that fits your age below.
  const mine: VocabPack[] = [
    ...vocabPacks.filter((x) => x.id === prefs.field),
    ...vocabPacks.filter((x) => prefs.interests.includes(x.id as never)),
  ].filter((x) => packFitsAge(x, prefs.ageGroup));
  // Seasonal packs (T21) are reached through the season banner while their season runs, not listed here.
  const others = vocabPacks.filter((x) => x.kind !== "season" && !mine.includes(x) && packFitsAge(x, prefs.ageGroup));

  if (reviewing) return <ReviewMode ids={due} onDone={() => go("")} />;

  if (openPack) {
    const words = openPack.words.filter((x) => allLevels || fitsLevel(x, p.cefr));
    const hidden = openPack.words.length - words.length;
    const done = openPack.words.filter((x) => known.has(x.id)).length;
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => go("")} className="h-11 self-start text-sm font-semibold text-brand">
          ← All my words
        </button>
        <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
          <p className="text-sm font-semibold opacity-80">
            {openPack.emoji} {openPack.titleNo}
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight">{openPack.title}</h1>
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round((done / openPack.words.length) * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs opacity-80">
              {done} of {openPack.words.length} words known
            </p>
          </div>
        </section>
        {hidden > 0 && (
          <button type="button" onClick={() => setAllLevels(true)} className="-mt-2 h-11 self-start text-sm font-semibold text-brand">
            Showing words for your level ({p.cefr}). Show {hidden} harder {hidden === 1 ? "word" : "words"} →
          </button>
        )}
        <ul className="flex flex-col gap-3">
          {words.map((word) => (
            <li key={word.id}>
              <WordCard word={word} known={known.has(word.id)} dueIn={now === null ? null : nextDueInDays(review[word.id], now)} nativeLanguage={p.nativeLanguage} />
            </li>
          ))}
        </ul>
        {openPack.kind === "field" && <FieldTest pack={openPack} />}
        {openPack.kind === "field" && <FieldScenarioLink packId={openPack.id} />}
        {openPack.kind === "season" && <SeasonBanner compact />}
      </div>
    );
  }

  const showSetup = (!hasPrefs(prefs) && !skipSetup) || editing;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">My words</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">The Norwegian for your life.</h1>
        <p className="mt-2 text-sm opacity-90">Words for your work, your interests and your level. Learn them once, then review them right before you forget.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-white/20 px-3 py-1">🧠 {known.size} known</span>
          <span className="rounded-full bg-white/20 px-3 py-1">🔁 {due.length} to review</span>
          {p.cefr && <span className="rounded-full bg-white/20 px-3 py-1">Level {p.cefr}</span>}
        </div>
      </section>

      {showSetup ? (
        <div className="flex flex-col gap-2">
          <AboutYou
            onDone={() => {
              setEditing(false);
              setSkipSetup(true);
            }}
          />
          {!editing && (
            <button type="button" onClick={() => setSkipSetup(true)} className="h-11 text-sm font-semibold text-muted underline">
              Skip, show me every pack
            </button>
          )}
        </div>
      ) : (
        <>
          <SeasonBanner />

          {due.length > 0 && (
            <Card className="flex items-center justify-between gap-3 border-accent bg-accent-soft">
              <div>
                <p className="font-bold">🔁 {due.length} {due.length === 1 ? "word" : "words"} to review</p>
                <p className="text-sm text-muted">Two minutes now saves an hour later.</p>
              </div>
              <Button variant="accent" onClick={() => go("review=1")}>
                Review
              </Button>
            </Card>
          )}

          {mine.length > 0 && (
            <section>
              <SectionTitle action={<button type="button" onClick={() => setEditing(true)} className="h-11 text-sm font-semibold text-brand">Edit about you</button>}>
                Picked for you
              </SectionTitle>
              <PackGrid packs={mine} known={known} onOpen={(id) => go(`pack=${id}`)} highlight />
            </section>
          )}

          <section>
            <SectionTitle
              action={
                mine.length === 0 ? (
                  <button type="button" onClick={() => setEditing(true)} className="h-11 text-sm font-semibold text-brand">
                    Personalise
                  </button>
                ) : undefined
              }
            >
              {mine.length ? "More packs" : "All packs"}
            </SectionTitle>
            <PackGrid packs={others} known={known} onOpen={(id) => go(`pack=${id}`)} />
          </section>

          <p className="text-center text-xs text-muted">
            <Link href="/mistakes" className="font-semibold text-brand">
              📓 Mistakes
            </Link>
            {" · "}Want the slang and the polite forms too?{" "}
            <Link href="/phrases" className="font-semibold text-brand">
              Open the phrasebook →
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function PackGrid({ packs, known, onOpen, highlight = false }: { packs: VocabPack[]; known: Set<string>; onOpen: (id: string) => void; highlight?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {packs.map((pack) => {
        const done = pack.words.filter((x) => known.has(x.id)).length;
        return (
          <li key={pack.id}>
            <button
              type="button"
              onClick={() => onOpen(pack.id)}
              className={`flex h-full w-full flex-col gap-2 rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                highlight ? "border-brand bg-brand-soft" : "border-line bg-surface"
              }`}
            >
              <span className="text-3xl" aria-hidden>
                {pack.emoji}
              </span>
              <span className="font-bold leading-tight">{pack.title}</span>
              <span className="text-xs text-muted">{pack.titleNo}</span>
              <ProgressBar value={done / pack.words.length} tone="success" label={`${pack.title}: ${done} of ${pack.words.length} known`} />
              <span className="text-xs font-semibold text-muted">
                {done}/{pack.words.length} known
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function WordCard({ word, known, dueIn, nativeLanguage }: { word: VocabWord; known: boolean; dueIn: number | null; nativeLanguage: string }) {
  const [saving, setSaving] = useState(false);
  const [practise, setPractise] = useState(false);

  async function learn() {
    setSaving(true);
    try {
      await progressActions.send({ type: "word_learned", wordId: word.id }); // the server gives the XP
      startReview(word.id);
    } catch {
      // the store already showed a toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => speakNorwegian(word.no.replace(/^(en|ei|et|å) /, ""), { slow: true })}
            aria-label={`Hear «${word.no}»`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface transition hover:bg-surface-2"
          >
            <span aria-hidden>🔊</span>
          </button>
          <div className="min-w-0">
            <p className="text-xl font-black" lang="nb">
              {word.no}
            </p>
            <p className="text-sm text-muted">{word.en}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone="muted">{word.level}</Badge>
          {word.register !== "neutral" && <RegisterTag register={word.register} />}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold" lang="nb">
            «<ExplainText text={word.example.no} />»
          </p>
          <p className="text-sm text-muted">{word.example.en}</p>
        </div>
        <button
          type="button"
          onClick={() => speakNorwegian(word.example.no)}
          aria-label="Hear the example"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface"
        >
          <span aria-hidden>🔊</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3">
        {nativeLanguage !== "en" && <TranslateButton text={word.example.no} from="nb" to={nativeLanguage} />}
        <button type="button" onClick={() => setPractise((x) => !x)} aria-expanded={practise} className="h-11 text-xs font-semibold text-muted underline">
          🎙️ {practise ? "Hide" : "Say it out loud"}
        </button>
      </div>
      {practise && <PronunciationCheck sentence={word.example.no} target={word.example.no} label="Say the example" />}

      {known ? (
        <p className="flex h-11 items-center justify-center rounded-2xl border border-success bg-success-soft text-sm font-semibold text-success">
          ✓ Known{dueIn !== null && (dueIn === 0 ? " · review today" : ` · review in ${dueIn} ${dueIn === 1 ? "day" : "days"}`)}
        </p>
      ) : (
        <Button variant="secondary" onClick={learn} disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : "🧠 I know it · +3 XP"}
        </Button>
      )}
    </Card>
  );
}

function ReviewMode({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  // Snapshot the list when the review starts, so answering doesn't reshuffle it.
  const [queue] = useState(ids);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [right, setRight] = useState(0);
  const word = queue[i] ? getVocabWord(queue[i]) : undefined;

  if (!word) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-5xl" aria-hidden>
          {queue.length ? "🎉" : "😌"}
        </p>
        <p className="text-xl font-black">{queue.length ? `Review done: ${right} of ${queue.length} right` : "Nothing to review right now"}</p>
        <p className="max-w-xs text-sm text-muted">Words you got right come back later; the others come back tomorrow.</p>
        <Button onClick={onDone}>Back to my words</Button>
      </Card>
    );
  }

  function answer(got: boolean) {
    answerReview(word!.id, got);
    if (got) setRight((r) => r + 1);
    setShown(false);
    setI((x) => x + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDone} className="h-11 text-sm font-semibold text-brand">
          ← Stop
        </button>
        <span className="text-sm font-semibold text-muted">
          {i + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar value={i / queue.length} tone="accent" label="Review progress" />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl font-black" lang="nb">
          {word.no}
        </p>
        <button type="button" onClick={() => speakNorwegian(word.no.replace(/^(en|ei|et|å) /, ""), { slow: true })} className="h-11 text-sm font-semibold text-brand">
          🔊 Hear it
        </button>
        {shown ? (
          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold">{word.en}</p>
            <p className="text-sm" lang="nb">
              «{word.example.no}»
            </p>
            <p className="text-sm text-muted">{word.example.en}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">What does it mean? Say it in your head, then check.</p>
        )}
      </Card>
      {shown ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => answer(false)}>
            🔁 Again
          </Button>
          <Button onClick={() => answer(true)}>✓ Got it</Button>
        </div>
      ) : (
        <Button size="lg" onClick={() => setShown(true)}>
          Show the meaning
        </Button>
      )}
    </div>
  );
}

function FieldScenarioLink({ packId }: { packId: string }) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">🎙️ Use these words out loud in a work scenario.</p>
      <Button href={`/speak?field=${packId}`} variant="accent" className="shrink-0">
        Practise
      </Button>
    </Card>
  );
}
