"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress, useToasts } from "@/lib/progress";

const TABS = [
  { href: "/", label: "Hjem", icon: "🏡" },
  { href: "/snakk", label: "Snakk", icon: "🎙" },
  { href: "/slang", label: "Slang", icon: "🎚" },
  { href: "/tolk", label: "Tolk", icon: "🤝" },
  { href: "/meg", label: "Meg", icon: "🏅" },
];

export function AppShell({
  title,
  back,
  children,
}: {
  title?: string;
  back?: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const p = useProgress();
  const toasts = useToasts();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-frost/90 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          {back ? (
            <Link href={back} aria-label="Tilbake" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sheet text-lg">
              ←
            </Link>
          ) : (
            <span className="display text-2xl font-extrabold text-gran">prat</span>
          )}
          {title && <h1 className="truncate text-xl font-bold">{title}</h1>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-bold">
          {p.level && <span className="rounded-full bg-sheet px-3 py-1 text-gran">{p.level}</span>}
          <span className="rounded-full bg-sheet px-3 py-1" title="Dager på rad">
            🔥 {p.streak}
          </span>
          <span className="rounded-full bg-sol px-3 py-1" title="Erfaringspoeng">
            {p.xp} XP
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-2">{children}</main>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-40 flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pop rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg">
            {t.icon} {t.text}
          </div>
        ))}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sheet/95 backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => {
            const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${on ? "text-gran" : "text-ink-soft"}`}
                >
                  <span className={`grid h-8 w-12 place-items-center rounded-full text-lg ${on ? "bg-gran-soft" : ""}`}>{t.icon}</span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function RegisterChip({ r }: { r: "kompis" | "hverdag" | "formell" | "unnga" }) {
  const map = {
    kompis: "bg-sol-soft text-ink",
    hverdag: "bg-gran-soft text-gran-deep",
    formell: "bg-fjord-soft text-fjord",
    unnga: "bg-tytte-soft text-tytte",
  } as const;
  const label = { kompis: "Kompis", hverdag: "Hverdag", formell: "Formell", unnga: "Unngå" }[r];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${map[r]}`}>{label}</span>;
}
