"use client";

import Link from "next/link";
import { Navbar, Footer, type WebChromeConfig } from "@speech-works/web-chrome";
import { siteUrl } from "@/lib/env";

// Client wrapper: builds the web-chrome config (with next/link for client-side nav)
// and renders the shared Navbar/Footer. Must be a client component because the
// config carries a LinkComponent, which can't cross the Server -> Client boundary.
const SITE = siteUrl;

const config: WebChromeConfig = {
  assetBaseUrl: SITE,
  activeItem: "blog",
  LinkComponent: Link as unknown as WebChromeConfig["LinkComponent"],
  links: {
    home: SITE,
    roadmap: `${SITE}/#roadmap`,
    platform: `${SITE}/#platform`,
    team: `${SITE}/#team`,
    blog: "/",
    clinicians: `${SITE}/clinicians`,
    download: `${SITE}/#download`,
    privacy: `${SITE}/privacy`,
  },
};

export function SiteNavbar() {
  return <Navbar config={config} />;
}

export function SiteFooter() {
  return <Footer config={config} />;
}
