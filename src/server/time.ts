import "server-only";

/** All day/week logic uses Norway's time zone, computed on the server (the client clock can't be trusted). */
const TZ = "Europe/Oslo";

/** YYYY-MM-DD in Oslo time. */
export function osloDay(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** ISO week id like "2026-W45" in Oslo time. */
export function osloWeek(date = new Date()): string {
  const [y, m, d] = osloDay(date).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
