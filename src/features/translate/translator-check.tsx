"use client";
/**
 * /translator (T22): check the on-device translator in THIS browser, and translate anything.
 * - Status: is the Translator API there, which pairs can this device do (Opera Web AI / Chrome).
 * - Self-test (needs a tap: the first use may download a model): Norwegian → your language and back, with timing.
 * - Free translation box: Snakk's checked translations first, then the device; glossary notes; round-trip check.
 * Nothing is sent to any server.
 */
import { useEffect, useState } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { TranslateButton } from "@/features/translate/translate-button";
import { LANGUAGE_NAMES } from "@/lib/content";
import { useProgress } from "@/lib/progress/store";
import { memorySize } from "@/lib/web-ai/memory";
import { checkTranslation, translateText, translationAvailability, translatorSupported } from "@/lib/web-ai/translator";

type Avail = Awaited<ReturnType<typeof translationAvailability>> | "checking";
const SAMPLE = "Hei! Jeg har time hos fastlegen på tirsdag, men jeg må jobbe. Kan vi flytte den?";

export function TranslatorCheck() {
  const p = useProgress();
  const mine = p.nativeLanguage && p.nativeLanguage !== "nb" ? p.nativeLanguage : "en";
  const pairs: [string, string][] = [
    ["nb", mine],
    [mine, "nb"],
    ...(mine !== "en" ? ([["nb", "en"]] as [string, string][]) : []),
  ];
  const [supported, setSupported] = useState<boolean | null>(null);
  const [avail, setAvail] = useState<Record<string, Avail>>({});
  const [test, setTest] = useState<
    | { kind: "idle" }
    | { kind: "running"; step: string }
    | { kind: "done"; out: string; back: string; confidence: string; ms: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [input, setInput] = useState("");
  const [dir, setDir] = useState<"from-nb" | "to-nb">("from-nb");

  // Status check after mount (the page is prerendered without a browser).
  useEffect(() => {
    const t = setTimeout(async () => {
      const ok = translatorSupported();
      setSupported(ok);
      if (!ok) return;
      for (const [a, b] of pairs) {
        setAvail((s) => ({ ...s, [`${a}>${b}`]: "checking" }));
        const r = await translationAvailability(a, b);
        setAvail((s) => ({ ...s, [`${a}>${b}`]: r }));
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per native language
  }, [mine]);

  async function runTest() {
    const started = performance.now();
    setTest({ kind: "running", step: "Translating…" });
    const r = await translateText(SAMPLE, "nb", mine, (l) => setTest({ kind: "running", step: `Downloading the model… ${Math.round(l * 100)}%` }), { memory: false });
    if (!r.ok) return setTest({ kind: "error", message: r.message });
    setTest({ kind: "running", step: "Translating back to compare…" });
    const c = await checkTranslation(SAMPLE, r.text, "nb", mine);
    setTest({ kind: "done", out: r.text, back: c?.back ?? "(couldn't translate back)", confidence: c?.confidence ?? "unknown", ms: Math.round(performance.now() - started) });
  }

  const name = (c: string) => LANGUAGE_NAMES[c] ?? c;
  const label: Record<string, { text: string; tone: "success" | "warn" | "danger" | "muted" }> = {
    available: { text: "✅ Ready", tone: "success" },
    downloadable: { text: "⬇️ Downloads on first use", tone: "warn" },
    downloading: { text: "⏳ Downloading", tone: "warn" },
    unavailable: { text: "✗ Not available", tone: "danger" },
    unsupported: { text: "✗ No translator", tone: "danger" },
    checking: { text: "Checking…", tone: "muted" },
  };
  const mem = memorySize();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">🌐 Translator</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Translation that stays on your phone.</h1>
        <p className="mt-2 text-sm opacity-90">
          Snakk uses the translator built into your browser (Opera Web AI or Chrome). Your text never leaves your device. For the {mem.nbToEn} Norwegian
          sentences and words in Snakk, you get our own checked translations first.
        </p>
      </section>

      <section>
        <SectionTitle>Your browser</SectionTitle>
        <Card className="flex flex-col gap-3">
          {supported === null ? (
            <p className="text-sm text-muted">Checking…</p>
          ) : supported ? (
            <>
              {/* Found the API but no pair works (yet): say so, instead of a ✅ above a list of ✗. */}
              {pairs.some(([a, b]) => (avail[`${a}>${b}`] ?? "checking") === "checking") ? (
                <p className="font-bold">Checking your translator…</p>
              ) : pairs.every(([a, b]) => ["unavailable", "unsupported"].includes(avail[`${a}>${b}`] ?? "")) ? (
                <p className="font-bold">⚠️ This browser has a translator, but it can&apos;t translate these languages right now.</p>
              ) : (
                <p className="font-bold">✅ This browser has an on-device translator.</p>
              )}
              <ul className="flex flex-col gap-2">
                {pairs.map(([a, b]) => {
                  const s = avail[`${a}>${b}`] ?? "checking";
                  return (
                    <li key={`${a}>${b}`} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        {name(a)} → {name(b)}
                      </span>
                      <Badge tone={label[s].tone}>{label[s].text}</Badge>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <p className="font-bold">✗ This browser has no on-device translator.</p>
              <p className="text-sm text-muted">Snakk&apos;s own checked translations still work. For everything else:</p>
            </>
          )}
          <details className="text-sm" open={supported === false || pairs.every(([a, b]) => ["unavailable", "unsupported"].includes(avail[`${a}>${b}`] ?? ""))}>
            <summary className="flex h-11 cursor-pointer items-center font-semibold text-brand">How to turn it on in Opera</summary>
            <ol className="list-inside list-decimal space-y-1 text-muted">
              <li>Update Opera to the latest version (Web AI is an early preview on Windows and Apple-silicon Macs).</li>
              <li>
                Open <span className="font-mono">opera://settings/ai</span> (Settings → Opera AI).
              </li>
              <li>Turn on «Enable Web AI API».</li>
              <li>Come back here and tap «Run the test». The first time, Opera downloads the language model.</li>
            </ol>
            <p className="mt-2 text-muted">Recent Chrome versions on desktop have the same translator built in.</p>
          </details>
        </Card>
      </section>

      {supported && (
        <section>
          <SectionTitle>Self-test</SectionTitle>
          <Card className="flex flex-col gap-3">
            <p className="text-sm" lang="nb">
              «{SAMPLE}»
            </p>
            <Button onClick={runTest} disabled={test.kind === "running"}>
              {test.kind === "running" ? test.step : `▶️ Run the test (Norwegian → ${name(mine)} → back)`}
            </Button>
            {test.kind === "error" && (
              <p className="rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn" role="status">
                {test.message}
              </p>
            )}
            {test.kind === "done" && (
              <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3 text-sm" role="status">
                <p dir="auto">
                  <span className="font-bold">{name(mine)}:</span> {test.out}
                </p>
                <p dir="auto" className="text-muted">
                  <span className="font-bold">Back to Norwegian:</span> {test.back}
                </p>
                <p className="font-semibold">
                  {test.confidence === "high" ? "✅ Works well" : test.confidence === "medium" ? "🟡 Works, check key words" : "⚠️ Works, but check carefully"} ·{" "}
                  {(test.ms / 1000).toFixed(1)} s
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>Translate anything</SectionTitle>
        <Card className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="radiogroup" aria-label="Direction">
            {(["from-nb", "to-nb"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={dir === d}
                onClick={() => setDir(d)}
                className={`h-11 rounded-xl text-sm font-bold ${dir === d ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
              >
                {d === "from-nb" ? `Norsk → ${name(mine)}` : `${name(mine)} → Norsk`}
              </button>
            ))}
          </div>
          <label htmlFor="free-text" className="sr-only">
            Text to translate
          </label>
          <textarea
            id="free-text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            rows={3}
            dir="auto"
            placeholder={dir === "from-nb" ? "Lim inn norsk tekst, f.eks. en melding fra skolen…" : `Write in ${name(mine)}…`}
            className="w-full rounded-2xl border border-line bg-bg p-3 text-base focus:border-brand focus:outline-none"
          />
          {input.trim() && (
            <TranslateButton key={`${dir}:${input}`} text={input} from={dir === "from-nb" ? "nb" : mine} to={dir === "from-nb" ? mine : "nb"} />
          )}
        </Card>
      </section>
    </div>
  );
}
