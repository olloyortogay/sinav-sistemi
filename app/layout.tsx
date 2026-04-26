import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sinav.turkdunyasi.uz'),
  title: {
    default: "Türk Dünyası Sınav Portalı | sinav.turkdunyasi.uz",
    template: "%s | Türk Dünyası Sınav Portalı",
  },
  description: "Özbekistan'ın En Gelişmiş Türkçe Sınav Portalı. Online placement, speaking ve writing imtihanlarını hızlı, güvenli ve profesyonel şekilde tamamlayın.",
  keywords: [
    "Türkçe sınav",
    "Türkçe seviye tespit",
    "speaking sınavı",
    "writing sınavı",
    "Özbekistan Türkçe sınav",
    "sinav.turkdunyasi.uz",
  ],
  openGraph: {
    type: "website",
    url: "https://sinav.turkdunyasi.uz",
    siteName: "Türk Dünyası Sınav Portalı",
    title: "Türk Dünyası Sınav Portalı",
    description: "Özbekistan'ın En Gelişmiş Türkçe Sınav Portalı",
    images: [
      {
        url: "/images/logo.webp",
        width: 1200,
        height: 630,
        alt: "Türk Dünyası Sınav Portalı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Türk Dünyası Sınav Portalı",
    description: "Özbekistan'ın En Gelişmiş Türkçe Sınav Portalı",
    images: ["/images/logo.webp"],
  },
};

import Providers from "../components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
