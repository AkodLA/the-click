import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Click",
  description: "Stemmeassistent for lagermedarbeidere – på ditt eget språk.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no">
      <body className="antialiased">{children}</body>
    </html>
  );
}
