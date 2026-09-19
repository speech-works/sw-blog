import Link from "next/link";
import { basePath, marketingUrl } from "@/lib/env";

// The header, footer, speech-bubble edge and download band from speechworks.app,
// rebuilt here so the blog opens and closes exactly like the marketing pages.
// Markup and class names mirror sw-landing's Navbar, Footer, SectionEdge and
// DownloadSection; the styles live in app/globals.css. Links other than the blog
// itself point back at the marketing site.
const SITE = marketingUrl;
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.speechworks.app";
const APP_STORE = process.env.NEXT_PUBLIC_APP_STORE_URL || "";

function Brand() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-mark" src={`${basePath}/brand/mark.svg`} width={27} height={31} alt="" />
      <span>Speechworks</span>
    </>
  );
}

function ArrowUpRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

export function SiteNavbar() {
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <a href={SITE} className="wordmark" aria-label="Speechworks home">
        <Brand />
      </a>
      <nav aria-label="Main navigation">
        <a href={`${SITE}/programs/`} className="nav-link">
          Programs
        </a>
        <a href={`${SITE}/about/`} className="nav-link">
          About
        </a>
        <Link href="/" className="nav-link" aria-current="page">
          Blog
        </Link>
        <a href={`${SITE}/#download`} className="button button-small button-ink pressable">
          <span>
            Get the <span className="nav-cta-free">free </span>app
          </span>{" "}
          <ArrowUpRight />
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="footer-wordmark" href={SITE} aria-label="Speechworks home">
        <Brand />
      </a>
      <nav aria-label="Support and legal">
        <a href={`${SITE}/programs/`}>Programs</a>
        <a href={`${SITE}/about/`}>About</a>
        <Link href="/">Blog</Link>
        <a href="mailto:contact@speechworks.in">Contact</a>
        <a href={`${SITE}/privacy/`}>Privacy</a>
        <a href={`${SITE}/account/delete/`}>Delete account</a>
      </nav>
    </footer>
  );
}

const edgeCurves = {
  wide: "M0 35C220 35 250 78 510 78C640 78 724 66 808 60C822 59 835 58 848 58C849 80 839 101 822 115C860 113 891 87 902 61C1110 82 1230 35 1440 35",
  compact: "M0 22C66 22 99 49 181 49C219 49 237 44 259 42C262 59 255 71 247 79C268 78 286 59 289 42C332 47 347 22 390 22",
};

/** The speech-bubble silhouette that closes the orange opening band. */
export function SectionEdge() {
  return (
    <div className="section-edge" aria-hidden="true">
      {(["wide", "compact"] as const).map((size) => {
        const width = size === "wide" ? 1440 : 390;
        const height = size === "wide" ? 140 : 90;
        return (
          <svg key={size} className={`section-edge-${size}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" focusable="false">
            <path className="section-edge-fill" d={`${edgeCurves[size]}V-1H0Z`} />
            <path className="section-edge-outline" d={edgeCurves[size]} fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
        );
      })}
    </div>
  );
}

const ribbonCurves = [
  {
    size: "wide",
    viewBox: "0 0 1440 180",
    path: "M-100 80H0C180 80 180 25 390 25C650 25 770 135 1020 135C1270 135 1260 80 1440 80H1540",
    close: "V180H-100Z",
  },
  {
    size: "compact",
    viewBox: "0 0 390 140",
    path: "M-195 65Q-97.5 145 0 65T195 65T390 65T585 65",
    close: "V140H-195Z",
  },
];

// Apple silhouette from Simple Icons (CC0).
function AppleMark() {
  return (
    <svg width="26" height="29" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg width="26" height="29" viewBox="0 0 26 29" aria-hidden="true">
      <path fill="#51C4EC" d="M1 1.2v26.6L14 14.5Z" />
      <path fill="#74CF84" d="m1 1.2 16.9 9.7-3.9 3.6Z" />
      <path fill="#FFD360" d="m17.9 10.9 6.3 3.6-6.3 3.6-3.9-3.6Z" />
      <path fill="#F17881" d="M1 27.8 17.9 18.1 14 14.5Z" />
    </svg>
  );
}

/** The curved black band that invites readers to the app, above the footer. */
export function DownloadBand() {
  return (
    <>
      <div className="download-ribbon" aria-hidden="true">
        {ribbonCurves.map(({ size, viewBox, path, close }) => (
          <svg key={size} className={`download-ribbon-${size}`} viewBox={viewBox} preserveAspectRatio="none" focusable="false">
            <defs>
              <path id={`download-ribbon-${size}-curve`} d={path} />
            </defs>
            <path className="download-ribbon-fill" d={`${path}${close}`} />
            <use href={`#download-ribbon-${size}-curve`} className="download-ribbon-band" />
          </svg>
        ))}
      </div>
      <section className="download-section" aria-labelledby="download-title">
        <div className="download-faces" aria-hidden="true">
          {["coils", "turban", "silver"].map((name) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={name} src={`${basePath}/avatars/${name}.svg`} width={60} height={60} alt="" draggable={false} />
          ))}
        </div>
        <h2 id="download-title">Get Speechworks.</h2>
        <p className="download-lede">Start with free daily practice and a free AI call. Buy a program when you are ready.</p>
        <div className="store-buttons">
          <a className="store-badge pressable" href={PLAY_STORE} target="_blank" rel="noopener noreferrer" aria-label="Get Speechworks on Google Play">
            <PlayMark />
            <span>
              <small>Get it on</small>
              <strong>Google Play</strong>
            </span>
          </a>
          {APP_STORE ? (
            <a className="store-badge pressable" href={APP_STORE} target="_blank" rel="noopener noreferrer" aria-label="Download Speechworks on the App Store">
              <AppleMark />
              <span>
                <small>Download on the</small>
                <strong>App Store</strong>
              </span>
            </a>
          ) : (
            <span className="store-badge store-coming" role="img" aria-label="Speechworks for iOS is coming soon">
              <AppleMark />
              <span>
                <small>Coming soon to the</small>
                <strong>App Store</strong>
              </span>
            </span>
          )}
        </div>
        <p className="download-note">Free to download, with free daily practice. Pay once for each program.</p>
      </section>
    </>
  );
}
