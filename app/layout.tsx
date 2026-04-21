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
  title: "Türk Dünyası | Konuşma Sınavı",
  description: "Türk dili konuşma becerilerini ölçen profesyonel sınav platformu",
  keywords: ["Türkçe sınav", "konuşma sınavı", "Türk Dünyası", "dil sınavı"],
  icons: {
    icon: [
      { url: '/images/logo.webp', type: 'image/webp' },
    ],
    apple: '/images/logo.webp',
    shortcut: '/images/logo.webp',
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
