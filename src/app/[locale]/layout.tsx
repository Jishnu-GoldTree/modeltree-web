import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Heebo } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";

import { SITE } from "@/lib/data/landing";
import { LOCALE_DIR, routing, type Locale } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { RouteProgress } from "@/components/layout/route-progress";
import { SkipLink } from "@/components/layout/skip-link";
import { Toaster } from "@/components/layout/toaster";
import { FlashToast } from "@/components/layout/flash-toast";
import { NewListingFab } from "@/components/layout/new-listing-fab";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { VisitorPrompts } from "@/components/layout/visitor-prompts";

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

async function buildMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "site" });
  return {
  metadataBase: new URL("https://modeltree.vercel.app"),
  title: {
    default: `${SITE.name} | ${t("tagline")}`,
    template: `%s | ${SITE.name}`,
  },
  description: t("description"),
  applicationName: SITE.name,
  keywords: [
    "3D models",
    "3D model marketplace",
    "commercial-use jewellery models",
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
    languages: { he: "/", en: "/en" },
  },
  openGraph: {
    title: `${SITE.name} | ${t("tagline")}`,
    description: t("description"),
    siteName: SITE.name,
    url: "/",
    locale: locale === "he" ? "he_IL" : "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${t("tagline")}`,
    description: t("description"),
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
}

/** Metadata has to be per-locale, so the tab title and share cards translate. */
export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata(hasLocale(routing.locales, locale) ? locale : routing.defaultLocale);
}

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
            <Suspense fallback={null}>
              <RouteProgress />
            </Suspense>
            <SkipLink />
            {children}
            <Toaster />
            <FlashToast />
            <NewListingFab />
            <WhatsAppFab />
            <VisitorPrompts />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
