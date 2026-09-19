import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { siteUrl, basePath } from "@/lib/env";
import { SiteNavbar, SiteFooter, DownloadBand } from "@/components/SiteChrome";

// Same Inter build as speechworks.app, so headings set identically.
const inter = localFont({
  src: [
    { path: "../fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Inter-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/Inter-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blog | Speechworks",
    template: "%s | Speechworks Blog",
  },
  description:
    "Real stories and evidence-based insight on stuttering and stammering, written by people who stutter and the speech-language pathologists who work alongside them.",
  alternates: { canonical: `${basePath || ""}/` },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <div className="site-shell">
          <SiteNavbar />
          {children}
          <DownloadBand />
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
