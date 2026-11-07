/**
 * Snakk UI kit. Use these instead of styling buttons/cards from scratch, so the app looks like ONE product.
 *   <Button href="/speak">Start</Button>   <Button variant="secondary" onClick={...}>…</Button>
 *   <Card>…</Card>   <Badge tone="brand">A2</Badge>   <ProgressBar value={0.4} />   <RegisterTag register="slang" />
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { REGISTER_STYLE } from "@/lib/content";
import type { Register } from "@/lib/content/types";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "md" | "lg";

// Chunky "toy" buttons: a solid bottom edge that presses down when tapped.
const PRESS = "-translate-y-0 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none";
const VARIANTS: Record<Variant, string> = {
  primary: `bg-brand text-brand-ink shadow-[0_4px_0_var(--brand-deep)] hover:brightness-105 ${PRESS}`,
  accent: `bg-accent text-white shadow-[0_4px_0_var(--accent-deep)] hover:brightness-105 ${PRESS}`,
  secondary: `bg-surface text-ink border-2 border-line shadow-[0_4px_0_var(--line)] hover:bg-surface-2 ${PRESS}`,
  ghost: "text-brand hover:bg-brand-soft",
};
const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-base",
  lg: "h-14 px-7 text-lg",
};

interface ButtonBase {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: ButtonBase & ({ href: string } | ({ href?: undefined } & ComponentProps<"button">))) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold tracking-wide transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-3xl border-2 border-line bg-surface p-5 shadow-[0_4px_0_var(--line)]", className)} {...rest}>
      {children}
    </div>
  );
}

type Tone = "brand" | "accent" | "success" | "warn" | "danger" | "muted";
const TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  muted: "bg-surface-2 text-muted",
};

export function Badge({ tone = "muted", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function RegisterTag({ register, withHint = false }: { register: Register; withHint?: boolean }) {
  const s = REGISTER_STYLE[register];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", s.className)}>
      {s.label}
      {withHint && <span className="font-normal opacity-80">· {s.hint}</span>}
    </span>
  );
}

export function ProgressBar({ value, tone = "brand", label }: { value: number; tone?: "brand" | "accent" | "success"; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const fill = { brand: "bg-brand", accent: "bg-accent", success: "bg-success" }[tone];
  return (
    <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-line bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("relative h-full rounded-full transition-all duration-500", fill)} style={{ width: `${pct}%` }}>
        {/* Glossy highlight, like a candy bar. */}
        <span className="absolute inset-x-1.5 top-0.5 h-0.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-xl font-semibold">{children}</h2>
      {/* Tap target ≥ 44 px for the "See all →" link, without changing how it looks. */}
      {action && <span className="[&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-end">{action}</span>}
    </div>
  );
}

/** Placeholder for screens a teammate still has to build. Shows the task id so nobody gets lost. */
export function ComingSoon({ task, title, emoji, children }: { task: string; title: string; emoji: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-soft text-5xl" aria-hidden>
        {emoji}
      </div>
      <Badge tone="warn">🚧 Coming soon · {task}</Badge>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="max-w-sm text-muted">{children}</p>
      {/* A beginner must never get stuck: always offer a way back. */}
      <Button href="/learn" variant="secondary" className="mt-2">
        ← Back to Home
      </Button>
    </div>
  );
}
