/**
 * Snakki, the Snakk mascot: a friendly speech bubble with a face. Purely decorative (aria-hidden).
 *   <Mascot className="h-24 w-24" />              bobbing gently
 *   <Mascot className="h-16 w-16" still />        no animation
 */
export function Mascot({ className, still = false }: { className?: string; still?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={`${still ? "" : "animate-float"} ${className ?? ""}`} aria-hidden>
      {/* Soft shadow on the ground */}
      <ellipse cx="60" cy="112" rx="30" ry="4" className="fill-ink opacity-10" />
      {/* Bubble body with a tail, plus a darker bottom edge like the buttons */}
      <path d="M22 18 H98 a16 16 0 0 1 16 16 V72 a16 16 0 0 1 -16 16 H52 L32 104 L36 88 H22 a16 16 0 0 1 -16 -16 V34 a16 16 0 0 1 16 -16 Z" className="fill-brand-deep" transform="translate(0 4)" />
      <path d="M22 18 H98 a16 16 0 0 1 16 16 V72 a16 16 0 0 1 -16 16 H52 L32 104 L36 88 H22 a16 16 0 0 1 -16 -16 V34 a16 16 0 0 1 16 -16 Z" className="fill-brand" />
      {/* Shine */}
      <path d="M20 30 Q22 24 30 24" className="stroke-white opacity-50" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <ellipse cx="44" cy="48" rx="7" ry="8.5" className="fill-white" />
      <ellipse cx="76" cy="48" rx="7" ry="8.5" className="fill-white" />
      <circle cx="46" cy="50" r="4" className="fill-ink" />
      <circle cx="78" cy="50" r="4" className="fill-ink" />
      <circle cx="47.5" cy="48" r="1.4" className="fill-white" />
      <circle cx="79.5" cy="48" r="1.4" className="fill-white" />
      {/* Rosy cheeks */}
      <ellipse cx="34" cy="64" rx="6" ry="3.5" className="fill-accent opacity-50" />
      <ellipse cx="86" cy="64" rx="6" ry="3.5" className="fill-accent opacity-50" />
      {/* Smile */}
      <path d="M50 64 Q60 74 70 64" className="stroke-ink" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** A little cloud for sky decorations. Decorative only. */
export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 50" className={className} aria-hidden>
      <path d="M20 45 a15 15 0 0 1 2 -30 a20 20 0 0 1 36 -6 a16 16 0 0 1 26 12 a12 12 0 0 1 -2 24 Z" className="fill-surface" />
    </svg>
  );
}

/** Hand-drawn squiggle to underline a word. Decorative only. */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 16" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M3 10 C 25 2, 45 15, 68 8 S 110 2, 132 9 S 175 15, 197 6" className="stroke-sun" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
