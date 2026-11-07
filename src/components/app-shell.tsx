"use client";
/**
 * The frame around every in-app screen: top bar (streak, level, XP), bottom nav on phones,
 * and reward toasts. Used by src/app/(app)/layout.tsx.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { levelProgress } from "@/lib/progress/levels";
import { onReward, useProgress, type Reward } from "@/lib/progress/store";

const NAV = [
  { href: "/learn", label: "Home", icon: "🏠" },
  { href: "/speak", label: "Speak", icon: "🎙️" },
  { href: "/phrases", label: "Phrases", icon: "💬" },
  { href: "/league", label: "League", icon: "🏆" },
  { href: "/profile", label: "Me", icon: "🙂" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4 md:pb-10">{children}</main>
      <BottomNav />
      <RewardToasts />
    </div>
  );
}

function TopBar() {
  const p = useProgress();
  const { level } = levelProgress(p.xp);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/learn" className="text-xl font-black tracking-tight text-brand">
          snakk<span className="text-accent">.</span>
        </Link>
        <nav className="hidden gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} compact />
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span title="Day streak" aria-label={`${p.streakDays} day streak`}>
            🔥 {p.streakDays}
          </span>
          <span title="Level" className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">
            Lv {level}
          </span>
          <span title="XP" className="text-accent">
            {p.xp} XP
          </span>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label, icon, compact = false }: { href: string; label: string; icon: string; compact?: boolean }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  if (compact) {
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${active ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"}`}>
        {label}
      </Link>
    );
  }
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold ${active ? "text-brand" : "text-muted"}`}>
      <span className={`text-xl transition ${active ? "scale-110" : "opacity-70"}`} aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function BottomNav() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
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
        <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg">
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
