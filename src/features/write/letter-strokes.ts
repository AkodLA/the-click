/**
 * How to write each letter, stroke by stroke, like a handwriting worksheet.
 * Each letter is a list of SVG paths in a 100×100 box, in the order you write them;
 * every path starts where you put your pen down (shown as ①, ②, …) and runs the way you move it.
 * Lines on the "school paper": capitals and tall letters from y=12, small letters from y=45,
 * baseline y=80, tails (g, j, p, q, y) down to y=98.
 */

const O_UPPER = "M50 12 C22 12 22 80 50 80 C78 80 78 12 50 12";
const A_UPPER = ["M50 12 L26 80", "M50 12 L74 80", "M34 56 L66 56"];
const P_BOWL = "M32 12 H52 C72 12 72 48 52 48 H32";
const A_BOWL = "M66 52 C60 40 34 40 34 62 C34 84 62 84 66 68";
const N_ARCH = "M34 58 C38 42 66 40 66 58 V80";
const O_LOWER = "M50 45 C30 45 30 80 50 80 C70 80 70 45 50 45";
// A dot (i, j): a tiny path so it still has a start point.
const dot = (x: number, y: number) => `M${x} ${y} L${x} ${y + 0.5}`;

export const LETTER_STROKES: Record<string, string[]> = {
  // ---- Capitals ----
  A: A_UPPER,
  B: ["M30 12 L30 80", "M30 12 H52 C70 12 70 46 52 46 H30", "M30 46 H55 C75 46 75 80 55 80 H30"],
  C: ["M72 22 C62 8 30 8 28 46 C30 84 62 84 72 70"],
  D: ["M30 12 L30 80", "M30 12 H46 C80 12 80 80 46 80 H30"],
  E: ["M32 12 V80", "M32 12 H68", "M32 46 H62", "M32 80 H68"],
  F: ["M32 12 V80", "M32 12 H68", "M32 46 H62"],
  G: ["M72 22 C62 8 30 8 28 46 C30 84 66 86 72 66 V50 H54"],
  H: ["M30 12 V80", "M70 12 V80", "M30 46 H70"],
  I: ["M50 12 V80"],
  J: ["M62 12 V64 C62 86 34 86 32 68"],
  K: ["M32 12 V80", "M68 12 L32 52", "M44 40 L70 80"],
  L: ["M34 12 V80 H68"],
  M: ["M24 80 V12 L50 58 L76 12 V80"],
  N: ["M30 80 V12 L70 80 V12"],
  O: [O_UPPER],
  P: ["M32 12 V80", P_BOWL],
  Q: [O_UPPER, "M56 62 L74 84"],
  R: ["M32 12 V80", P_BOWL, "M48 48 L70 80"],
  S: ["M70 22 C62 8 30 10 32 30 C34 46 68 42 70 62 C72 84 36 86 28 70"],
  T: ["M26 12 H74", "M50 12 V80"],
  U: ["M30 12 V58 C30 86 70 86 70 58 V12"],
  V: ["M26 12 L50 80 L74 12"],
  W: ["M16 12 L32 80 L50 30 L68 80 L84 12"],
  X: ["M28 12 L72 80", "M72 12 L28 80"],
  Y: ["M26 12 L50 46", "M74 12 L50 46 L50 80"],
  Z: ["M28 12 H72 L28 80 H72"],
  Æ: ["M44 12 L18 80", "M44 12 V80", "M44 12 H80", "M44 46 H76", "M44 80 H80", "M28 56 H44"],
  Ø: [O_UPPER, "M72 8 L28 84"],
  Å: ["M50 18 L26 80", "M50 18 L74 80", "M34 58 L66 58", "M50 2 A5 5 0 1 0 50.01 2"],

  // ---- Small letters ----
  a: [A_BOWL, "M66 45 V80"],
  b: ["M34 12 V80", "M34 58 C40 42 70 42 70 62 C70 84 40 84 34 70"],
  c: ["M66 52 C58 40 34 42 34 62 C34 84 58 84 66 72"],
  d: [A_BOWL, "M66 12 V80"],
  e: ["M34 62 H66 C66 44 36 40 34 60 C34 84 60 84 66 74"],
  f: ["M64 16 C58 8 44 10 44 26 V80", "M32 45 H60"],
  g: ["M66 52 C60 40 34 40 34 60 C34 80 62 80 66 64", "M66 45 V88 C66 102 40 102 34 92"],
  h: ["M34 12 V80", N_ARCH],
  i: ["M50 45 V80", dot(50, 30)],
  j: ["M56 45 V88 C56 100 40 100 36 92", dot(56, 30)],
  k: ["M34 12 V80", "M64 45 L34 66", "M44 59 L66 80"],
  l: ["M50 12 V80"],
  m: ["M24 45 V80", "M24 56 C28 42 50 40 50 56 V80", "M50 56 C54 42 76 40 76 56 V80"],
  n: ["M34 45 V80", N_ARCH],
  o: [O_LOWER],
  p: ["M34 45 V98", "M34 58 C40 42 70 42 70 62 C70 84 40 84 34 70"],
  q: [A_BOWL, "M66 45 V98"],
  r: ["M38 45 V80", "M38 58 C42 46 54 42 64 46"],
  s: ["M64 50 C58 40 36 42 38 54 C40 62 62 60 64 70 C66 82 40 84 34 74"],
  t: ["M46 20 V72 C46 82 58 82 64 76", "M34 45 H62"],
  u: ["M34 45 V64 C34 84 66 84 66 64", "M66 45 V80"],
  v: ["M32 45 L50 80 L68 45"],
  w: ["M20 45 L34 80 L50 52 L66 80 L80 45"],
  x: ["M34 45 L66 80", "M66 45 L34 80"],
  y: ["M32 45 L50 80", "M68 45 L44 98"],
  z: ["M34 45 H66 L34 80 H66"],
  æ: ["M46 52 C42 42 24 42 24 62 C24 82 44 82 46 70", "M46 45 V80", "M46 62 H76 C76 44 48 40 46 58 C46 84 70 84 76 74"],
  ø: [O_LOWER, "M68 40 L32 86"],
  å: [A_BOWL, "M66 45 V80", "M50 22 A5 5 0 1 0 50.01 22"],
};
