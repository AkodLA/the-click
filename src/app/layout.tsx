import type { Metadata } from "next";
import { Fredoka, Geist_Mono, Noto_Color_Emoji, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Cozy, friendly type: rounded Fredoka for headings, soft Nunito for reading.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// T24: word pictures are emoji. One emoji font (self-hosted, split by character, loaded only when a picture
// is on screen) makes them look the same on every phone and computer, incl. older Android and Windows 10.
const emoji = Noto_Color_Emoji({
  variable: "--font-emoji",
  weight: "400",
  subsets: ["emoji"],
  preload: false,
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snakk: learn the Norwegian people actually speak",
  description: "Speak Norwegian from day one with an AI voice tutor: slang, formal and informal, levels A0–C2.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} ${geistMono.variable} ${emoji.variable} h-full antialiased`}
      // theme-init.js sets data-theme before React hydrates.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
