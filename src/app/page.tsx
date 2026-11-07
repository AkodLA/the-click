import { Badge, Button, RegisterTag } from "@/components/ui";
import { scenarios } from "@/lib/content";

// Public landing page: the first thing the jury sees. Owner: T15 (polish + pricing).
// Rule for this page: a visitor should get "app to SPEAK everyday Norwegian" within 5 seconds.

const STEPS = [
  { emoji: "🧭", title: "Find your level", text: "A 3-minute test places you from A0 (total beginner) to C2." },
  { emoji: "🎙️", title: "Talk out loud", text: "Practise real situations with an AI voice tutor that answers like a Norwegian would." },
  { emoji: "🏷️", title: "Know what fits where", text: "Every phrase is tagged slang, informal, neutral or formal, so you never say «halla» to your boss." },
];

const FEATURES = [
  { emoji: "🎯", title: "Pronunciation check", text: "Say it out loud and see which words came through, and which didn't." },
  { emoji: "😎", title: "Slang, with a manual", text: "When to say «digg», when NOT to, and what to say instead." },
  { emoji: "🧑‍🤝‍🧑", title: "Tolk interpreter", text: "Not ready yet? Snakk interprets your parent-teacher meeting, so your kids don't have to." },
  { emoji: "🤝", title: "Anonymous tandem", text: "Swap languages with natives. Nicknames and avatars only." },
  { emoji: "🧇", title: "Språkkafé near you", text: "Find language cafés, check in, and practise in real life." },
  { emoji: "🔥", title: "Streaks and leagues", text: "XP, achievements and weekly leagues with learners at your level." },
];

const AUDIENCES = ["New in Norway", "Working here", "Parents with kids in school", "Students", "Partners of Norwegians"];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <span className="text-2xl font-black tracking-tight text-brand">
            snakk<span className="text-accent">.</span>
          </span>
          <nav aria-label="Page" className="hidden gap-6 text-sm font-semibold text-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#situations" className="hover:text-ink">Situations</a>
            <a href="#features" className="hover:text-ink">Features</a>
          </nav>
          <Button href="/learn" className="h-10 px-4 text-sm">
            Open app
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* Hero: what it is, who it's for, one main action */}
        <section className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge tone="brand" className="px-3 py-1 text-sm">🇳🇴 Speaking app for Norwegian · A0–C2</Badge>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Learn the Norwegian <span className="text-brand">people actually speak.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Practise real conversations out loud with an AI voice tutor, and learn which words fit where: with friends,
              at work, at the doctor. From your first «hei» to fluent.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row [&>*]:whitespace-nowrap">
              <Button href="/onboarding" size="lg">
                Find my level, free
              </Button>
              <Button href="/learn" size="lg" variant="secondary">
                Try it first
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">✓ No account · ✓ Free to start · ✓ Works on your phone</p>
          </div>

          {/* Visual: the "same thing, three rooms" idea that makes Snakk different */}
          <div className="w-full max-w-lg justify-self-center rounded-[2rem] lg:max-w-none border border-line bg-surface p-6 shadow-xl">
            <p className="text-sm font-semibold text-muted">One meaning, three ways to say it</p>
            <p className="mt-1 text-xl font-black">«That was great!»</p>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 p-4">
                <span className="text-lg font-bold">«Det var sykt bra, ass!»</span>
                <RegisterTag register="slang" withHint />
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 p-4">
                <span className="text-lg font-bold">«Det var kjempebra!»</span>
                <RegisterTag register="informal" withHint />
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 p-4">
                <span className="text-lg font-bold">«Det var svært vellykket.»</span>
                <RegisterTag register="formal" withHint />
              </li>
            </ul>
            <p className="mt-4 text-sm text-muted">💡 Snakk tells you which one fits the room you&apos;re in.</p>
          </div>
        </section>

        {/* Who it's for */}
        <section aria-label="Who Snakk is for" className="flex flex-wrap items-center justify-center gap-2 border-y border-line py-6">
          <span className="mr-1 text-sm font-semibold text-muted">Made for:</span>
          {AUDIENCES.map((a) => (
            <span key={a} className="rounded-full bg-surface px-3 py-1 text-sm font-semibold shadow-sm ring-1 ring-line">
              {a}
            </span>
          ))}
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 py-16">
          <h2 className="text-center text-3xl font-black tracking-tight">How it works</h2>
          <p className="mt-2 text-center text-muted">Three steps. Five minutes a day.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl border border-line bg-surface p-6 shadow-sm">
                <span className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-brand-ink">
                  {i + 1}
                </span>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-3xl" aria-hidden>
                  {s.emoji}
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Real situations: makes "real life Norwegian" concrete */}
        <section id="situations" className="scroll-mt-20 pb-16">
          <h2 className="text-center text-3xl font-black tracking-tight">Practise the moments that matter</h2>
          <p className="mt-2 text-center text-muted">Your tutor plays the other person. You just talk.</p>
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {scenarios.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-bold leading-snug">{s.title}</p>
                  <p className="text-xs font-semibold text-muted">Level {s.level}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Everything else */}
        <section id="features" className="scroll-mt-20 pb-16">
          <h2 className="text-center text-3xl font-black tracking-tight">More ways to get fluent</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
                <div className="text-3xl" aria-hidden>
                  {f.emoji}
                </div>
                <div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className="mb-16 rounded-[2rem] bg-brand px-6 py-12 text-center text-brand-ink shadow-md">
          <h2 className="text-3xl font-black tracking-tight">Say your first «hei» today.</h2>
          <p className="mx-auto mt-2 max-w-md opacity-90">Find your level in 3 minutes. No account, no credit card.</p>
          <Button href="/onboarding" size="lg" variant="secondary" className="mt-6">
            Find my level, free →
          </Button>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        Built in one weekend by The Click at Oslo Sprint 2026 · No accounts, no personal data on our servers
      </footer>
    </div>
  );
}
