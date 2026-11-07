import { Button, RegisterTag } from "@/components/ui";

// Public landing page: the first thing the jury sees. Owner: T15 (polish + pricing).
const FEATURES = [
  { emoji: "🎙️", title: "Speak from day one", text: "Real conversations with a voice tutor: at the kiosk, at a party, at the doctor." },
  { emoji: "🎯", title: "Pronunciation check", text: "Say it out loud and see exactly which words came through, and which didn't." },
  { emoji: "😎", title: "Slang, with a manual", text: "When to say «digg», when NOT to, and what to say instead." },
  { emoji: "🧑‍🤝‍🧑", title: "Tolk", text: "Not ready yet? Snakk interprets your parent-teacher meeting, so your kids don't have to." },
  { emoji: "🤝", title: "Anonymous tandem", text: "Swap languages with natives. Nicknames and avatars only." },
  { emoji: "🏆", title: "Levels A0–C2", text: "Placement test, XP, streaks, achievements and leagues at your level." },
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <span className="text-2xl font-black tracking-tight text-brand">
          snakk<span className="text-accent">.</span>
        </span>
        <Button href="/learn" variant="ghost" className="text-sm">
          Open app →
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="font-semibold text-accent">Learn Norwegian by speaking it</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Textbooks teach Norwegian. <span className="text-brand">We teach how Norway talks.</span>
            </h1>
            <p className="mt-5 text-lg text-muted">
              Talk out loud with an AI tutor, learn the slang people actually use, and know when to switch to formal. From
              your first «hei» to C2.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/onboarding" size="lg">
                Find my level, free
              </Button>
              <Button href="/learn" size="lg" variant="secondary">
                Try the app
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">✓ No account needed · ✓ Free to start · ✓ Works on your phone</p>
          </div>

          {/* Visual: the "same thing, three rooms" idea */}
          <div className="rounded-[2rem] border border-line bg-surface p-6 shadow-xl">
            <p className="text-sm font-semibold text-muted">How do you say «that was great» in…</p>
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
            <p className="mt-4 text-sm text-muted">Snakk tells you which one fits the room you&apos;re in.</p>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
              <div className="text-3xl" aria-hidden>
                {f.emoji}
              </div>
              <h2 className="mt-3 text-lg font-bold">{f.title}</h2>
              <p className="mt-1 text-muted">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        Built in one weekend by The Click at Oslo Sprint 2026
      </footer>
    </div>
  );
}
