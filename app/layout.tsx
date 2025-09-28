// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ✅ Static import of a Client Component is allowed in a Server Component
import { Providers } from "./provider";
import { PageLoading } from "@/components/ui/page-loading";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGV Protocol - NFT Minting Platform",
  description: "Mint AGV NFTs across multiple blockchain networks with USDT",
  keywords: ["NFT", "AGV", "blockchain", "minting", "crypto"],
  authors: [{ name: "AGV Protocol" }],
  creator: "AGV Protocol",
  publisher: "AGV Protocol",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL("https://agv-protocol.com"),
  openGraph: {
    title: "AGV Protocol - NFT Minting Platform",
    description: "Mint AGV NFTs across multiple blockchain networks with USDT",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGV Protocol - NFT Minting Platform",
    description: "Mint AGV NFTs across multiple blockchain networks with USDT",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Language alternates for SEO */}
        <link rel="alternate" hrefLang="en" href="/en" />
        <link rel="alternate" hrefLang="zh-CN" href="/zh-CN" />
        <link rel="alternate" hrefLang="zh-TW" href="/zh-TW" />
        <link rel="alternate" hrefLang="ko" href="/ko" />
        <link rel="alternate" hrefLang="tl" href="/tl" />
        <link rel="alternate" hrefLang="fr" href="/fr" />
        <link rel="alternate" hrefLang="de" href="/de" />
        <link rel="alternate" hrefLang="es" href="/es" />
        <link rel="alternate" hrefLang="ar" href="/ar" />
        <link rel="alternate" hrefLang="ja" href="/ja" />
        <link rel="alternate" hrefLang="x-default" href="/en" />
        
        {/* Optional prefetches */}
        <link rel="prefetch" href="/dashboard" />
        <link rel="prefetch" href="/kol" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* ✅ Providers is a client component, rendered directly */}
        <Providers>
          <PageLoading />
          <div className="relative flex min-h-screen flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
