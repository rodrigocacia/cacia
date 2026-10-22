import "./globals.css"

import Script from "next/script"
import { Geist, Geist_Mono, Newsreader } from "next/font/google"

/**
 * Tipografia da CacIA (direção visual 02).
 *
 * Geist na interface e nos dados; Newsreader, serifa editorial de alto
 * contraste, nos títulos; Geist Mono nos rótulos. Os eixos variáveis vêm
 * inteiros: o Newsreader ajusta o desenho ao tamanho (opsz) sozinho.
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
})

// Fora do `metadata`: o Next 16 só aceita o viewport no export próprio
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  // Base das URLs do openGraph; sem ela, a prévia do link compartilhado
  // apontava para localhost
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: "CacIA BETA – Assistente Jurídica no WhatsApp (100 vagas exclusivas)",
  description:
    "Exclusivo para 100 advogados que não têm mais tempo a perder: garanta agora sua vaga na CacIA BETA e descubra a assistente jurídica que transforma sua rotina no WhatsApp.",
  openGraph: {
    title:
      "CacIA BETA – Assistente Jurídica no WhatsApp (100 vagas exclusivas)",
    description:
      "Exclusivo para 100 advogados que não têm mais tempo a perder: garanta agora sua vaga na CacIA BETA e descubra a assistente jurídica que transforma sua rotina no WhatsApp.",
    url: "https://seusite.com", // coloque aqui sua URL real
    siteName: "CacIA",
    images: [
      {
        url: "/cacia-seo.jpg",
        width: 1200,
        height: 630,
        alt: "CacIA BETA – Assistente Jurídica no WhatsApp",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "CacIA BETA – Assistente Jurídica no WhatsApp (100 vagas exclusivas)",
    description:
      "Exclusivo para 100 advogados que não têm mais tempo a perder: garanta agora sua vaga na CacIA BETA e descubra a assistente jurídica que transforma sua rotina no WhatsApp.",
    images: ["/cacia-seo.jpg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-br"
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <body className="bg-ink font-sans text-tinta antialiased">
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W3JKHWFM');`,
          }}
        />
        {/* Facebook Pixel */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1173789334515959');
fbq('track', 'PageView');
`,
          }}
        />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W3JKHWFM"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Facebook Pixel (noscript) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1173789334515959&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
      </body>
    </html>
  )
}
