/**
 * Exams & resources (/resources): where to take the official tests, and free help to get there.
 * Every link was opened and checked on 7 Nov 2026. Dates and prices change: we always point to the
 * official page instead of copying details that go stale. Snakk isn't affiliated with any of these.
 */
import { Badge, Card, SectionTitle } from "@/components/ui";

const CHECKED = "7 Nov 2026";

interface Resource {
  emoji: string;
  title: string;
  /** Who runs it. */
  by: string;
  text: string;
  href: string;
  /** Short facts shown as badges. */
  tags?: string[];
  /** Something to double-check before relying on it. */
  note?: string;
}

const TESTS: Resource[] = [
  {
    emoji: "🗣️",
    title: "Norskprøven (A1–B2)",
    by: "HK-dir",
    text: "The official Norwegian test, oral and written. Used for jobs, studies, permanent residence and citizenship. You register in set weeks, through a test centre near you.",
    href: "https://prove.hkdir.no/en/norwegian-language-test-a1-b2",
    tags: ["A1–B2", "Oral + written"],
    note: "Next registration week on the official page: 25–29 January 2027.",
  },
  {
    emoji: "🎓",
    title: "Norskprøven C1",
    by: "HK-dir",
    text: "Higher academic level, for advanced learners (for example for university or professional work). Page in Norwegian.",
    href: "https://prove.hkdir.no/norskproven-c1-hoyere-akademisk-niva",
    tags: ["C1"],
  },
  {
    emoji: "🇳🇴",
    title: "Statsborgerprøven (citizenship test)",
    by: "HK-dir",
    text: "A test about Norwegian society that you must pass to apply for Norwegian citizenship. Taken in Norwegian.",
    href: "https://prove.hkdir.no/en/norwegian-citizenship-test",
    tags: ["Citizenship"],
  },
  {
    emoji: "🏛️",
    title: "Samfunnskunnskapsprøven (social studies test)",
    by: "HK-dir",
    text: "A test about life and society in Norway, which you can take in a language you understand. Part of many residence and integration requirements.",
    href: "https://prove.hkdir.no/en/social-studies-test",
    tags: ["Many languages"],
  },
  {
    emoji: "📜",
    title: "Bergenstesten (Test in Norwegian – higher level)",
    by: "Folkeuniversitetet",
    text: "An official test of Norwegian at B2 and C1 level, often used for studies and work.",
    href: "https://www.folkeuniversitetet.no/en/bergenstesten",
    tags: ["B2–C1"],
    note: "Check upcoming dates on the page first: we couldn't confirm new test dates.",
  },
];

const RULES: Resource[] = [
  {
    emoji: "📋",
    title: "Citizenship: what you need",
    by: "UDI",
    text: "The Norwegian Directorate of Immigration explains the rules for applying for citizenship, including the language and test requirements.",
    href: "https://www.udi.no/en/want-to-apply/citizenship/",
  },
  {
    emoji: "🧭",
    title: "New in Norway",
    by: "IMDi",
    text: "Official information for newcomers in one place: residence, work, housing, health, and how to learn Norwegian.",
    href: "https://www.nyinorge.no/en/",
  },
];

const LEARN: Resource[] = [
  {
    emoji: "💻",
    title: "Norwegian on the Web (NoW)",
    by: "NTNU",
    text: "A full online course from a Norwegian university, from everyday expressions and basic grammar upwards. Open to anyone who wants to learn.",
    href: "https://www.ntnu.edu/now",
    tags: ["Course"],
  },
  {
    emoji: "📕",
    title: "Ordbøkene (the official dictionaries)",
    by: "Språkrådet + University of Bergen",
    text: "Look up spelling and every form of a word in Bokmål and Nynorsk. Perfect for checking your notes.",
    href: "https://ordbokene.no/",
    tags: ["Dictionary"],
  },
  {
    emoji: "📰",
    title: "Klar Tale",
    by: "Klar Tale",
    text: "Norway's easy-to-read newspaper: real news in simple Norwegian, with an audio edition. Great daily reading practice.",
    href: "https://www.klartale.no/",
    tags: ["Easy news", "Audio"],
  },
];

function ResourceCard({ r }: { r: Resource }) {
  return (
    <li>
      <a
        href={r.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col gap-2 rounded-3xl border-2 border-line bg-surface p-5 shadow-[0_4px_0_var(--line)] transition hover:-translate-y-0.5 hover:bg-surface-2"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-2xl" aria-hidden>
            {r.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
            <p className="text-xs font-bold text-muted">{r.by}</p>
          </div>
        </div>
        <p className="text-sm">{r.text}</p>
        {r.tags && (
          <div className="flex flex-wrap gap-1.5">
            {r.tags.map((t) => (
              <Badge key={t} tone="brand">
                {t}
              </Badge>
            ))}
          </div>
        )}
        {r.note && <p className="rounded-2xl bg-warn-soft p-2.5 text-xs font-semibold text-warn">⚠️ {r.note}</p>}
        <span className="mt-auto pt-1 text-sm font-bold text-brand">
          Open {new URL(r.href).hostname.replace(/^www\./, "")} ↗<span className="sr-only"> (opens in a new tab)</span>
        </span>
      </a>
    </li>
  );
}

function Group({ id, title, intro, items }: { id: string; title: string; intro: string; items: Resource[] }) {
  return (
    <section aria-labelledby={id}>
      <SectionTitle>
        <span id={id}>{title}</span>
      </SectionTitle>
      <p className="-mt-1 mb-3 text-sm text-muted">{intro}</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((r) => (
          <ResourceCard key={r.href} r={r} />
        ))}
      </ul>
    </section>
  );
}

export function ResourcesView() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[2rem] border-2 border-brand-deep bg-brand p-6 text-brand-ink shadow-[0_5px_0_var(--brand-deep)]">
        <p className="font-display text-lg font-medium opacity-90">🎓 Exams & resources</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">Ready for the real test?</h1>
        <p className="mt-2 text-sm opacity-90">
          Where to take the official Norwegian tests, the rules that ask for them, and free help to get there.
        </p>
      </section>

      <Card className="flex flex-col gap-2 bg-surface-2">
        <p className="font-display text-lg font-semibold">🤔 Which test do I need?</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          <li>💼 <b>Job or studies:</b> usually Norskprøven (often B1 or B2), or Bergenstesten / C1 for university.</li>
          <li>🏡 <b>Permanent residence or citizenship:</b> Norwegian + social studies or citizenship test. The exact rules are on UDI.</li>
          <li>🌱 <b>Just learning:</b> no test needed. Practise here and use the free resources below.</li>
        </ul>
        <p className="text-xs text-muted">Rules change, so always check UDI or your employer before you book.</p>
      </Card>

      <Group id="tests" title="📝 Official tests" intro="Run by HK-dir (the Norwegian Directorate for Higher Education and Skills) and Folkeuniversitetet." items={TESTS} />
      <Group id="rules" title="📋 Rules & life in Norway" intro="Official pages that explain what's required and where to start." items={RULES} />
      <Group id="learn" title="📚 Free help to learn" intro="Our favourite free resources to practise next to Snakk." items={LEARN} />

      <p className="text-center text-xs text-muted">
        Links checked {CHECKED}. Snakk isn&apos;t connected to these organisations. Dates, prices and rules change, so the official page is always right.
      </p>
    </div>
  );
}
