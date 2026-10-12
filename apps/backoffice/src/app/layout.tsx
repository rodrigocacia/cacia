import "./globals.css";

import { Geist, Geist_Mono, Newsreader } from "next/font/google";

/**
 * Tipografia da CacIA (direção visual 02), a mesma do app do escritório.
 *
 * Geist na interface e nos dados; Newsreader, serifa editorial, nos títulos;
 * Geist Mono nos rótulos.
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata = {
  title: "Backoffice CacIA",
  description: "Backoffice CacIA",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-br"
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <body className="bg-ink font-sans text-tinta antialiased">
        {children}
      </body>
    </html>
  );
}
