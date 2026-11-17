import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { SiteFrame } from "@/components/layout/site-frame";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vanilla & Strawberry — Small-batch gelato in Brooklyn",
    template: "%s · Vanilla & Strawberry",
  },
  description:
    "Small-batch gelato, sorbet and layered sundaes made slowly in Brooklyn. Order online, reserve a table, or scan the QR code at your table.",
  openGraph: {
    title: "Vanilla & Strawberry",
    description: "Small-batch gelato, made slowly. Brooklyn.",
    type: "website",
    images: ["/images/strawberry-cloud.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanilla & Strawberry",
    description: "Small-batch gelato, made slowly. Brooklyn.",
    images: ["/images/strawberry-cloud.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF8EF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-vanilla-0"
        >
          Skip to content
        </a>
        <AppProviders>
          <SiteFrame>{children}</SiteFrame>
        </AppProviders>
      </body>
    </html>
  );
}
