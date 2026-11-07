import type { Metadata } from "next";
import { Fredoka, Geist_Mono, Nunito } from "next/font/google";
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
      className={`${fredoka.variable} ${nunito.variable} ${geistMono.variable} h-full antialiased`}
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
