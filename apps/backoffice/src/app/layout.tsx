import "./globals.css";

import { Montserrat, Plus_Jakarta_Sans } from "next/font/google";

import { IconesOffline } from "@/components/icones-offline";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Backoffice CacIA",
  description: "Backoffice CacIA - by AdvAI, powered by ∆ ∟ Q ⋈",
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
      className={`${montserrat.variable} ${plusJakarta.variable}`}
    >
      <body className="bg-[#FCFCFD]">
        <IconesOffline />
        {children}
      </body>
    </html>
  );
}
