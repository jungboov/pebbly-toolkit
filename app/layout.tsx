import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://toolkit.pebblylabs.com"),
  title: {
    default: "Pixel Remover — AI Background Removal in Your Browser | Pebbly Toolkit",
    template: "%s | Pebbly Toolkit",
  },
  description:
    "AI-powered background removal that runs 100% in your browser. No uploads, no servers, no tracking. Free and privacy-first. Built by Pebbly Labs.",
  keywords: [
    "background removal",
    "AI image editor",
    "remove background",
    "transparent PNG",
    "privacy-first",
    "browser-based",
    "no upload",
    "local AI",
    "Pebbly",
    "free background remover",
  ],
  authors: [{ name: "Pebbly Labs", url: "https://pebblylabs.com" }],
  creator: "Pebbly Labs",
  publisher: "Pebbly Labs",

  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    url: "https://toolkit.pebblylabs.com",
    siteName: "Pebbly Toolkit",
    title: "Pixel Remover — AI Background Removal in Your Browser",
    description:
      "Remove image backgrounds with AI, entirely in your browser. No uploads. No servers. 100% private. Free forever.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pebbly Pixel Remover — AI Background Removal",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@pebblylabs",
    creator: "@pebblylabs",
    title: "Pixel Remover — AI Background Removal in Your Browser",
    description:
      "Remove backgrounds with AI. Runs locally. No uploads. No servers. 100% private. Free.",
    images: ["/og-image.png"],
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

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },

  alternates: {
    canonical: "https://toolkit.pebblylabs.com",
  },

  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00ff00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        {children}
      </body>
    </html>
  );
}
