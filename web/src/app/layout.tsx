import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, basePath } from "@/lib/env";
import { SiteNavbar, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blog | Speechworks",
    template: "%s | Speechworks Blog",
  },
  description:
    "Practical insights from speech-language pathologists on fluency, therapy, and everyday communication, from the Speechworks clinical community.",
  alternates: { canonical: `${basePath || ""}/` },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com/" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com/"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SiteNavbar />
        {/* Flex column so the footer sits at the viewport bottom on short pages.
            The fixed navbar is offset via --nav-height (matches sw-landing). */}
        <div className="flex min-h-dvh flex-col">
          <div className="flex-1 pt-[var(--nav-height)] pb-20 md:pb-28">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
