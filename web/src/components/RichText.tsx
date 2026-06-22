import {
  RichText as LexicalRichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import type { Media } from "@/payload-types";
import type { LexicalBody } from "@/lib/types";

// Render the Lexical body to React, hand-mapped to brand tokens so long-form posts
// read like the rest of the site (app-title headings, brand links, warm body text).
// Default converters handle inline marks (bold/italic/code); we override the
// block-level nodes + links + in-text images.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => (
    <p className="mt-5 text-[17px] leading-relaxed text-gray-700 md:text-lg">
      {nodesToJSX({ nodes: node.children })}
    </p>
  ),
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    if (node.tag === "h2")
      return (
        <h2 className="mt-12 text-2xl font-bold tracking-tight text-app-title md:text-3xl">
          {children}
        </h2>
      );
    if (node.tag === "h3")
      return (
        <h3 className="mt-9 text-xl font-bold tracking-tight text-app-title md:text-2xl">
          {children}
        </h3>
      );
    return (
      <h4 className="mt-7 text-lg font-semibold tracking-tight text-app-title">
        {children}
      </h4>
    );
  },
  quote: ({ node, nodesToJSX }) => (
    <blockquote className="mt-7 border-l-4 border-brand bg-brand-50 px-6 py-4 text-lg italic text-app-title">
      {nodesToJSX({ nodes: node.children })}
    </blockquote>
  ),
  list: ({ node, nodesToJSX }) => {
    const cls =
      "mt-5 space-y-2 pl-6 text-[17px] leading-relaxed text-gray-700 md:text-lg";
    if (node.tag === "ol")
      return (
        <ol className={`list-decimal ${cls}`}>
          {nodesToJSX({ nodes: node.children })}
        </ol>
      );
    return (
      <ul className={`list-disc ${cls}`}>
        {nodesToJSX({ nodes: node.children })}
      </ul>
    );
  },
  link: ({ node, nodesToJSX }) => {
    const url = node.fields?.url || "#";
    const external = /^https?:\/\//.test(url);
    return (
      <a
        href={url}
        className="font-medium text-brand underline decoration-brand/30 underline-offset-2 transition-colors hover:text-brand-600"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {nodesToJSX({ nodes: node.children })}
      </a>
    );
  },
  upload: ({ node }) => {
    const value = node.value as Media | number | undefined;
    if (!value || typeof value !== "object" || !value.url) return null;
    return (
      <figure className="mt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.url}
          alt={value.alt || ""}
          width={value.width ?? undefined}
          height={value.height ?? undefined}
          className="h-auto w-full rounded-2xl"
          loading="lazy"
        />
        {value.alt ? (
          <figcaption className="mt-2 text-center text-sm text-app-muted">
            {value.alt}
          </figcaption>
        ) : null}
      </figure>
    );
  },
});

export default function RichText({ data }: { data?: LexicalBody }) {
  if (!data) return null;
  return <LexicalRichText data={data} converters={converters} />;
}
