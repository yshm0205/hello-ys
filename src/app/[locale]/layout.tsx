import { Toaster } from "@/components/ui/sonner";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import type { Metadata } from "next";
import "../globals.css";

// Mantine imports
import '@mantine/core/styles.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { tossTheme } from '@/theme';

import { ClientWidgets } from "@/components/shared/ClientWidgets";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: {
      template: "%s | FlowSpot",
      default: t("title"),
    },
    description: t("description"),
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ),
    authors: [{ name: "FlowSpot", url: "https://flowspot.app" }],
    creator: "FlowSpot",
    openGraph: {
      title: "FlowSpot - AI Script Agent",
      description: "조회수가 터지는 스크립트의 비밀. AI가 자동으로 쇼츠 스크립트를 생성합니다.",
      images: ["/images/og-image.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      images: ["/images/og-image.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ko")) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Global SaaS Starter Kit",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Global SaaS Starter Kit",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com",
              logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/og-image.png`,
            }),
          }}
        />
        <ColorSchemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider theme={tossTheme}>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <ClientWidgets />
            </ThemeProvider>
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
