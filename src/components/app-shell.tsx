"use client";
/**
 * The frame around every in-app screen: top bar (streak, level, XP), bottom nav on phones,
 * and reward toasts. Used by src/app/(app)/layout.tsx.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { LanguageWelcome } from "@/features/languages/language-picker";
import { levelProgress } from "@/lib/progress/levels";
import { onReward, useProgress, type Reward } from "@/lib/progress/store";

const NAV = [
  { href: "/learn", label: "Home", icon: "🏠" },
  { href: "/speak", label: "Speak", icon: "🎙️" },
  { href: "/phrases", label: "Phrases", icon: "💬" },
  { href: "/league", label: "League", icon: "🏆" },
  { href: "/profile", label: "Me", icon: "🙂" },
];

/** Screens with a desktop two-column layout get a wider frame; the rest stay a readable single column. */
const WIDE_PATHS = ["/learn"];

export function AppShell({ children }: { children: ReactNode }) {
  const wide = WIDE_PATHS.includes(usePathname());
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className={`mx-auto w-full flex-1 px-4 pb-28 pt-4 md:px-6 md:pb-10 ${wide ? "max-w-2xl lg:max-w-5xl" : "max-w-2xl"}`}>{children}</main>
      <BottomNav />
      <RewardToasts />
      <LanguageWelcome />
    </div>
  );
}

function TopBar() {
  const p = useProgress();
  const { level } = levelProgress(p.xp);
  return (
    <header className="sticky top-0 z-20 border-b-2 border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 md:px-6 lg:max-w-5xl">
        <Link href="/learn" className="flex items-center gap-1.5 font-display text-2xl font-bold tracking-tight text-brand">
          <Mascot className="h-8 w-8" still />
          <span>
            snakk<span className="text-accent">.</span>
          </span>
        </Link>
        <nav className="hidden gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} compact />
          ))}
        </nav>
        <Link href="/profile" aria-label={`Your progress: ${p.streakDays} day streak, level ${level}, ${p.xp} XP`} className="flex items-center gap-1.5 text-sm font-bold tabular-nums">
          <span title="Day streak" className={`rounded-full px-2.5 py-1 ${p.streakDays > 0 ? "bg-warn-soft text-warn" : "bg-surface-2 text-muted"}`}>
            🔥 {p.streakDays}
          </span>
          <span title="Player level" className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">
            Lv {level}
          </span>
          <span title="Total XP" className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">
            ⚡ {p.xp}
          </span>
        </Link>
      </div>
    </header>
  );
}

function NavLink({ href, label, icon, compact = false }: { href: string; label: string; icon: string; compact?: boolean }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  if (compact) {
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-3.5 py-1.5 font-display font-medium ${active ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"}`}>
        {label}
      </Link>
    );
  }
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-semibold ${active ? "text-brand" : "text-muted hover:text-ink"}`}>
      <span className={`flex h-8 w-14 items-center justify-center rounded-full text-xl transition ${active ? "bg-brand-soft" : "opacity-70 grayscale-[40%]"}`} aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function BottomNav() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-2xl">
        {NAV.map((n) => (
          <NavLink key={n.href} {...n} />
        ))}
      </div>
    </nav>
  );
}

function RewardToasts() {
  const [items, setItems] = useState<Reward[]>([]);
  useEffect(
    () =>
      onReward((r) => {
        setItems((prev) => [...prev.slice(-2), r]);
        setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== r.id)), 2800);
      }),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-30 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((r) => (
        <div key={r.id} className="animate-toast-in flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg">
          <span className="text-2xl" aria-hidden>
            {r.emoji}
          </span>
          <div>
            <p className="font-bold text-accent">{r.title}</p>
            <p className="text-sm text-muted">{r.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
