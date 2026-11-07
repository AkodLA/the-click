"use client";

export type OrbState = "idle" | "connecting" | "listening" | "speaking";

export function VoiceOrb({
  state,
  onClick,
  idleLabel,
}: {
  state: OrbState;
  onClick: () => void;
  idleLabel: string;
}) {
  const label =
    state === "idle" ? idleLabel : state === "connecting" ? "Kobler til …" : state === "speaking" ? "Snakker" : "Jeg lytter";
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        aria-label={state === "idle" ? idleLabel : "Avslutt samtalen"}
        className={`relative grid h-40 w-40 place-items-center rounded-full text-5xl transition-colors ${
          state === "idle"
            ? "bg-gran text-white"
            : state === "speaking"
              ? "orb-live bg-sol text-ink"
              : state === "listening"
                ? "orb-live bg-sheet text-ink ring-8 ring-gran"
                : "bg-sheet text-ink"
        }`}
      >
        {state === "idle" ? "🎙" : state === "speaking" ? "🔊" : state === "listening" ? "👂" : "…"}
      </button>
      <p className="font-bold" aria-live="polite">
        {label}
      </p>
      {state !== "idle" && <p className="text-sm text-ink-soft">Trykk på sirkelen for å avslutte</p>}
    </div>
  );
}
