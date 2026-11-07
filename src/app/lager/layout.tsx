// The warehouse app keeps its original dark theme (it was built first, for the Holio challenge).
export default function DarkLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0b1220] text-[#e8edf5]">{children}</div>;
}
