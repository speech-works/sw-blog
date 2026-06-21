import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url";
import { stegaClean } from "next-sanity";
import { urlForImage } from "@/lib/sanity.image";

// Hand-mapped to brand tokens (no typography plugin) so long-form posts read like
// the rest of the site: app-title headings, brand links, warm body text.
const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-12 text-2xl font-bold tracking-tight text-app-title md:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-9 text-xl font-bold tracking-tight text-app-title md:text-2xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-7 text-lg font-semibold tracking-tight text-app-title">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-5 text-[17px] leading-relaxed text-gray-700 md:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-7 border-l-4 border-brand bg-brand-50 px-6 py-4 text-lg italic text-app-title">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-gray-700 md:text-lg">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-2 pl-6 text-[17px] leading-relaxed text-gray-700 md:text-lg">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-app-title">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-app-title/5 px-1.5 py-0.5 font-mono text-[0.9em] text-app-title">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = (value as { href?: string } | undefined)?.href || "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          className="font-medium text-brand underline decoration-brand/30 underline-offset-2 transition-colors hover:text-brand-600"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const source = value as SanityImageSource & {
        alt?: string;
        size?: string;
        asset?: unknown;
      };
      // During live editing an image block can exist before its asset finishes
      // uploading (no `asset` yet). Skip it instead of letting urlForImage throw
      // "Unable to resolve image URL from source".
      if (!source?.asset) return null;
      // In draft/preview mode, stega injects invisible markers into string fields,
      // so `size` must be cleaned before it's used as a lookup key — otherwise the
      // key won't match and the chosen size has no effect in the preview.
      const cleaned = stegaClean(source.size);
      const size: "small" | "medium" | "full" =
        cleaned === "small" || cleaned === "medium" ? cleaned : "full";
      // Fetch a CDN width that matches the display size (smaller display = smaller
      // download), and constrain + center small/medium images. Classes are literal
      // strings so Tailwind picks them up.
      const cdnWidth = { small: 800, medium: 1100, full: 1400 }[size];
      const sizeClass = {
        small: "mx-auto w-full max-w-sm",
        medium: "mx-auto w-full max-w-xl",
        full: "w-full",
      }[size];
      const url = urlForImage(source).width(cdnWidth).url();
      return (
        <figure className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={source.alt || ""}
            className={`${sizeClass} h-auto rounded-2xl`}
            loading="lazy"
          />
          {source.alt ? (
            <figcaption className="mt-2 text-center text-sm text-app-muted">
              {source.alt}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  },
};

export default function PortableBody({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}
