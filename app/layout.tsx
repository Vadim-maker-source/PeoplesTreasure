import type { Metadata, Viewport } from "next";
import { Geist, Nunito, Unbounded } from "next/font/google";
import ThemeProvider from "@/providers/ThemeProvider";
import "./globals.css";

const siteUrl = "https://peoples-treasure.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Сокровища народов",
    template: "%s | Сокровища народов",
  },
  description:
    "Просветительский проект о традициях, языках, ремёслах и культурном наследии народов России.",
  keywords: [
    "народы России",
    "культура народов России",
    "традиции народов",
    "культурное наследие",
    "фольклор",
    "национальная кухня",
  ],
  alternates: {
    canonical: siteUrl,
    languages: { "ru-RU": siteUrl },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "Сокровища народов",
    title: "Сокровища народов",
    description: "Культура и наследие народов России.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.json",
  verification: {
    google: "J4SWkvw8ahsz2ZJ0ZvvohanahGxLnQPEfT5RAa4S1No",
    yandex: "4e4ae6843d5ef552",
  },
  authors: [{ name: "Сокровища народов" }],
  creator: "Сокровища народов",
  publisher: "Сокровища народов",
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Сокровища народов",
  url: siteUrl,
  description: "Культура и наследие народов России",
  inLanguage: "ru-RU",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${unbounded.variable} ${geistSans.variable} ${geistSans.className} ${nunito.variable} min-h-screen scroll-smooth bg-[#FFF9F9] antialiased transition-colors duration-300 dark:bg-[#1A1A1A]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
