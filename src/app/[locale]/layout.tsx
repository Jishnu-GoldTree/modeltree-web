import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Heebo } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";

import { SITE } from "@/lib/data/landing";
import { LOCALE_DIR, routing, type Locale } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/layout/toaster";
import { FlashToast } from "@/components/layout/flash-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Geist has no Hebrew coverage — without this, Hebrew text falls back to a
 * system font and looks unrelated to the brand. Heebo is a Hebrew/Latin
 * companion with similar proportions.
 */
const heebo = Heebo({
  variable: "--font-hebrew",
  subsets: ["hebrew", "latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://modeltree.vercel.app"),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "3D models",
    "3D model marketplace",
    "royalty-free 3D models",
    "buy 3D models",
    "sell 3D models",
    "PBR textures",
    "3D printing models",
    "STL files",
    "game assets",
    "CGI assets",
  ],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: {
    canonical: "/",
    // Tells Google these are translations of each other rather than duplicates.
    languages: { en: "/", he: "/he" },
  },
  openGraph: {
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
    siteName: SITE.name,
    url: "/",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Lets the static renderer prerender this locale instead of bailing to
  // dynamic because a translation was read.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={LOCALE_DIR[locale as Locale]}
      className={`${geistSans.variable} ${geistMono.variable} ${heebo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <NextIntlClientProvider>
          <Providers>
            {children}
            <Toaster />
            <FlashToast />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
