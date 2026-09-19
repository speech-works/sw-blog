import Link from "next/link";
import { SectionEdge } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <main id="main-content">
      <div className="page-hero">
        <section className="lost-intro section-wrap">
          <p className="section-kicker">404</p>
          <h1>We couldn&apos;t find that article.</h1>
          <p>It may have moved or never existed. Browse the latest writing instead.</p>
          <Link href="/" className="button button-ink pressable">
            Back to the blog
          </Link>
        </section>
      </div>
      <SectionEdge />
    </main>
  );
}
