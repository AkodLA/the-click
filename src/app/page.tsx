import Link from "next/link";
import { Cloud, Mascot, Squiggle } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, RegisterTag } from "@/components/ui";
import { LanguageWelcome } from "@/features/languages/language-picker";
import { scenarios } from "@/lib/content";
import { ForOrganisations, LandingScreens, Pricing } from "@/features/landing/landing-extras";

// Public landing page: the first thing the jury sees. Owner: T15 (polish + pricing).
// Rule for this page: a visitor should get "fun app to SPEAK everyday Norwegian" within 5 seconds.

const CARD = "rounded-3xl border-2 border-line bg-surface shadow-[0_4px_0_var(--line)]";
// Alternating little tilts make the cards feel hand-placed, like stickers on a fridge.
const TILT = ["-rotate-1", "rotate-1", "-rotate-[0.5deg]"];

const STEPS = [
  { href: "/onboarding", emoji: "🧭", title: "Find your level", text: "A 3-minute quiz estimates your level, from total beginner (A0) to near-native (C2)." },
  { href: "/speak", emoji: "🎙️", title: "Talk out loud", text: "Chat with a friendly AI voice tutor in real situations. Mistakes welcome!" },
  { href: "/phrases", emoji: "🏷️", title: "Say it like a local", text: "Everyday Norwegian as it's really used, and which words fit which situation." },
];

const FEATURES = [
  { href: "/tolk", emoji: "🧑‍🤝‍🧑", title: "Tolk: be understood now", text: "You speak your language, they hear theirs. At school pickup, at work, or travelling in Japan, China or Russia." },
  { href: "/phrases", emoji: "🎯", title: "Pronunciation check", text: "Say it out loud and see which words came through." },
  { href: "/phrases", emoji: "💬", title: "Phrases with context", text: "When to use a phrase, when not to, and what to say instead." },
  { href: "/words", emoji: "🧠", title: "Words for your life", text: "Word packs for your job and interests, with pictures." },
  { href: "/profile", emoji: "🌳", title: "Levels, streaks, badges", text: "XP, a weekly league and a little tree that grows as you practise." },
  { href: "/profile", emoji: "📱", title: "On all your devices", text: "A sync code moves your progress to your phone. No email, no password." },
];

const AUDIENCES = ["🏡 New in Norway", "💼 Working here", "🎒 Parents of school kids", "📚 Students", "✈️ Travelling abroad"];

const BUBBLES = [
  { text: "Det var sykt bra, ass!", register: "slang" as const, tilt: "-rotate-2", align: "self-start" },
  { text: "Det var kjempebra!", register: "informal" as const, tilt: "rotate-1", align: "self-end" },
  { text: "Det var svært vellykket.", register: "formal" as const, tilt: "-rotate-1", align: "self-start" },
];

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <span className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight text-brand">
            <Mascot className="h-9 w-9" still />
            <span>
              snakk<span className="text-accent">.</span>
            </span>
          </span>
          <nav aria-label="Page" className="hidden gap-6 font-display font-medium text-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#situations" className="hover:text-ink">Situations</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#organisations" className="hover:text-ink">For organisations</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* Hero: what it is, who it's for, one main action */}
        <section className="relative grid items-center gap-12 py-12 md:py-16 lg:grid-cols-2 lg:py-20">
          <Cloud className="pointer-events-none absolute -left-10 top-4 w-28 animate-float opacity-90" />
          <Cloud className="pointer-events-none absolute right-0 top-0 w-20 animate-float opacity-80 [animation-delay:1.5s] lg:right-1/2" />

          <div className="relative">
            <span className="inline-flex -rotate-2 items-center gap-2 rounded-full border-2 border-line bg-sun px-4 py-1.5 font-display text-sm font-semibold text-ink shadow-[0_3px_0_var(--line)]">
              🇳🇴 Speak like a local, from day one
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
              Learn the language{" "}
              <span className="relative inline-block text-brand">
                as it&apos;s really spoken.
                <Squiggle className="absolute -bottom-2 left-0 h-3 w-full" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Talk out loud with a friendly AI tutor in real situations, and learn which words fit where. Can&apos;t speak it
              yet? Tolk speaks the local language for you. Norwegian first, from your first «hei» to fluent.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row [&>*]:whitespace-nowrap">
              <Button href="/onboarding" size="lg">
                Find my level, free
              </Button>
              <Button href="/tolk" size="lg" variant="secondary">
                Be understood now (Tolk)
              </Button>
            </div>
            <p className="mt-5 text-sm font-semibold text-muted">✓ No email, no password · ✓ Free to start · ✓ Works on your phone</p>
          </div>

          {/* Visual: Snakki shows "same thing, three rooms" as a little chat */}
          <div className={`relative mx-auto w-full max-w-md p-6 lg:max-w-none ${CARD}`}>
            <div className="flex items-center gap-3">
              <Mascot className="h-16 w-16 shrink-0" />
              <div className="rounded-2xl rounded-bl-sm bg-brand-soft px-4 py-2">
                <p className="text-sm text-muted">How do you say</p>
                <p className="font-display text-lg font-semibold">«That was great!»</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {BUBBLES.map((b) => (
                <li key={b.text} className={`flex max-w-[92%] flex-col items-start gap-1.5 rounded-2xl border-2 border-line bg-surface-2 px-4 py-3 shadow-[0_3px_0_var(--line)] ${b.tilt} ${b.align}`}>
                  <span className="font-display text-lg font-semibold">«{b.text}»</span>
                  <RegisterTag register={b.register} withHint />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-muted">💡 Snakk tells you which one fits the room you&apos;re in.</p>
          </div>
        </section>

        {/* Who it's for */}
        <section aria-label="Who Snakk is for" className="flex flex-wrap items-center justify-center gap-2 py-4">
          <span className="mr-1 font-display font-semibold text-muted">Made for</span>
          {AUDIENCES.map((a, i) => (
            <span key={a} className={`rounded-full border-2 border-line bg-surface px-3.5 py-1 text-sm font-bold shadow-[0_3px_0_var(--line)] ${TILT[i % TILT.length]}`}>
              {a}
            </span>
          ))}
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 py-16">
          <h2 className="text-center text-4xl font-bold">How it works</h2>
          <p className="mt-2 text-center text-lg text-muted">Three steps. Five minutes a day. Lots of «heia!»</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`relative transition hover:-translate-y-0.5 hover:rotate-0 ${CARD} ${TILT[i]}`}>
                <Link href={s.href} className="block h-full rounded-3xl p-6 pt-8">
                <span className="absolute -top-4 left-6 flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-sun font-display text-lg font-bold text-ink shadow-[0_3px_0_var(--line)]">
                  {i + 1}
                </span>
                <div className="text-4xl" aria-hidden>
                  {s.emoji}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{s.title} →</h3>
                <p className="mt-1 text-muted">{s.text}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Real situations: makes "real life Norwegian" concrete */}
        <section id="situations" className="scroll-mt-20 pb-16">
          <h2 className="text-center text-4xl font-bold">Practise the moments that matter</h2>
          <p className="mt-2 text-center text-lg text-muted">Your tutor plays the other person. You just talk. Tap one to start.</p>
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {scenarios.map((s, i) => (
              <li key={s.id} className={`transition hover:-translate-y-0.5 hover:rotate-0 ${CARD} ${TILT[i % TILT.length]}`}>
                <Link href={`/speak?scenario=${s.id}`} className="flex items-center gap-3 rounded-3xl p-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
                  {s.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-snug">{s.title}</p>
                  <p className="text-sm font-bold text-muted">Level {s.level}</p>
                </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Everything else */}
        <section id="features" className="scroll-mt-20 pb-16">
          <h2 className="text-center text-4xl font-bold">Everything in Snakk</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className={`flex gap-4 p-5 transition hover:-translate-y-0.5 ${CARD}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-2xl" aria-hidden>
                  {f.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{f.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* T15: screenshots, organisations, pricing (src/features/landing/landing-extras.tsx) */}
        <LandingScreens />
        <ForOrganisations />
        <Pricing />

        {/* Final call to action */}
        <section className="relative mb-16 overflow-hidden rounded-[2.5rem] border-2 border-brand-deep bg-brand px-6 py-12 text-center text-brand-ink shadow-[0_6px_0_var(--brand-deep)]">
          <Cloud className="pointer-events-none absolute -left-6 top-6 w-24 opacity-30" />
          <Cloud className="pointer-events-none absolute -right-4 bottom-4 w-28 opacity-30" />
          <span className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-deep bg-surface shadow-[0_4px_0_var(--brand-deep)]">
            <Mascot className="h-16 w-16" />
          </span>
          <h2 className="relative mt-3 text-4xl font-bold">Say your first «hei» today.</h2>
          <p className="relative mx-auto mt-2 max-w-md text-lg opacity-90">Find your level in 3 minutes. No account, no credit card.</p>
          <Button href="/onboarding" size="lg" variant="secondary" className="relative mt-7">
            Find my level, free →
          </Button>
        </section>
      </main>

      <LanguageWelcome />

      <footer className="border-t-2 border-line bg-surface/70 py-8 text-center text-sm font-semibold text-muted">
        Made with ☕ and 💙 by The Click at Oslo Sprint 2026 · No email, no password, no real names
      </footer>
    </div>
  );
}
