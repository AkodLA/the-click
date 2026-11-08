/**
 * Landing page sections added in T15: real app screenshots, "For organisations" and pricing.
 * Rendered on the landing page (src/app/page.tsx) below T16's features section. Server components, no client JS.
 * Wording follows docs/PITCH.md: Tolk is a communication aid, never "a certified interpreter".
 */
import { Badge, Button } from "@/components/ui";

const SCREENS = [
  { src: "/screens/speak.png", title: "Talk to your tutor", text: "Real situations, out loud. Slang in a job interview? The tutor tells you." },
  { src: "/screens/phrases.png", title: "Slang with a manual", text: "Every phrase: when to use it, when not to, and what to say instead." },
];

export function LandingScreens() {
  return (
    <section id="screens" className="scroll-mt-20 pb-16" aria-labelledby="screens-title">
      <h2 id="screens-title" className="text-center text-3xl font-black tracking-tight">
        See it in action
      </h2>
      <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:mx-auto md:grid md:max-w-3xl md:grid-cols-2 md:overflow-visible">
        {SCREENS.map((s) => (
          <figure key={s.src} className="w-64 shrink-0 snap-center md:w-auto">
            <div className="overflow-hidden rounded-[2rem] border-4 border-ink/90 bg-surface shadow-lg">
              {/* Plain <img>: static screenshots, sized up front so the layout doesn't jump. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={`Snakk app: ${s.title}`} width={375} height={760} loading="lazy" className="block h-auto w-full" />
            </div>
            <figcaption className="mt-3 text-center">
              <p className="font-bold">{s.title}</p>
              <p className="text-sm text-muted">{s.text}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const ORG_POINTS = [
  { emoji: "🏢", title: "Employers & warehouses", text: "Staff practise the Norwegian of their workplace: safety words, breaks, small talk at lunch." },
  { emoji: "🏛️", title: "Municipalities & introduction programmes", text: "Speaking practice between classes, with progress the teacher can follow." },
  { emoji: "🏫", title: "Schools & clinics", text: "Tolk for everyday moments with parents and patients: pickup, a quick question, a first visit." },
  { emoji: "🔌", title: "Partner API", text: "Phrases with context for your own screens or robots, behind a scoped API key." },
];

export function ForOrganisations() {
  return (
    <section id="organisations" className="scroll-mt-20 pb-16" aria-labelledby="orgs-title">
      <div className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm md:p-10">
        <Badge tone="brand">For organisations</Badge>
        <h2 id="orgs-title" className="mt-3 text-3xl font-black tracking-tight">
          Help your team understand each other.
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Snakk seats for your team, plus Tolk for the moments when they&apos;re not ready yet. No personal data on our servers: learners use
          nicknames.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ORG_POINTS.map((o) => (
            <div key={o.title} className="flex gap-4 rounded-3xl bg-surface-2 p-5">
              <div className="text-3xl" aria-hidden>
                {o.emoji}
              </div>
              <div>
                <h3 className="font-bold">{o.title}</h3>
                <p className="mt-1 text-sm text-muted">{o.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl bg-warn-soft p-4 text-sm">
          <span className="font-bold">⚖️ Honest note:</span> Tolk is a communication aid, not a certified interpreter. When a public service needs
          an interpreter (tolkeloven), it must book a qualified one. Tolk helps in all the everyday moments in between.
        </p>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "For learners",
    price: "Free",
    per: "to start",
    highlight: true,
    points: [
      "Level test, phrasebook and daily voice practice",
      "Tolk for everyday moments and travel",
      "Progress on all your devices with a sync code",
      "Plus, 99 kr / month: unlimited voice tutor and Tolk",
    ],
    cta: { label: "Start speaking", href: "/onboarding" },
  },
  {
    name: "For workplaces",
    price: "Per seat",
    per: "/ month",
    highlight: false,
    points: [
      "Multilingual teams: warehouses, schools, clinics",
      "Training in the Norwegian of your workplace",
      "Tolk so colleagues understand each other from day one",
      "No personal data: nicknames only",
    ],
    cta: { label: "See Tolk", href: "/tolk" },
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 pb-16" aria-labelledby="pricing-title">
      <h2 id="pricing-title" className="text-center text-3xl font-black tracking-tight">
        Simple pricing
      </h2>
      <p className="mt-2 text-center text-sm text-muted">Planned pricing for launch. Everything in this demo is free.</p>
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`flex flex-col gap-4 rounded-3xl border p-6 shadow-sm ${p.highlight ? "border-brand bg-brand-soft ring-4 ring-brand/20" : "border-line bg-surface"}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{p.name}</h3>
              
            </div>
            <p>
              <span className="text-4xl font-black">{p.price}</span> <span className="text-muted">{p.per}</span>
            </p>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {p.points.map((pt) => (
                <li key={pt} className="flex gap-2">
                  <span className="text-success" aria-hidden>
                    ✓
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
            <Button href={p.cta.href} variant={p.highlight ? "primary" : "secondary"}>
              {p.cta.label}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
