import {
  RichText as LexicalRichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import type { Media } from "@/payload-types";
import type { LexicalBody } from "@/lib/types";

// Render the Lexical body to React. Typography comes from `.prose-body` in
// globals.css (ink headings, lime pull quotes, orange-underlined links), so posts
// read like the rest of speechworks.app.
// Default converters handle inline marks (bold/italic/code); we override the
// block-level nodes + links + in-text images.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => (
    <p>
      {nodesToJSX({ nodes: node.children })}
    </p>
  ),
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    if (node.tag === "h2")
      return (
        <h2>
          {children}
        </h2>
      );
    if (node.tag === "h3")
      return (
        <h3>
          {children}
        </h3>
      );
    return (
      <h4>
        {children}
      </h4>
    );
  },
  quote: ({ node, nodesToJSX }) => (
    <blockquote>
      {nodesToJSX({ nodes: node.children })}
    </blockquote>
  ),
  list: ({ node, nodesToJSX }) => {
    if (node.tag === "ol")
      return (
        <ol>
          {nodesToJSX({ nodes: node.children })}
        </ol>
      );
    return (
      <ul>
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
        className="ink-link"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {nodesToJSX({ nodes: node.children })}
      </a>
    );
  },
  upload: ({ node }) => {
    const value = node.value as Media | number | undefined;
    if (!value || typeof value !== "object" || !value.url) return null;
    // The author's Small/Medium/Full choice (stored on the upload node).
    const size = (node as { fields?: { size?: string } }).fields?.size ?? "full";
    const sizeClass =
      { small: "mx-auto w-full max-w-sm", medium: "mx-auto w-full max-w-xl", full: "w-full" }[
        size
      ] ?? "w-full";
    // Download a variant matched to the display size.
    const variant =
      size === "small"
        ? value.sizes?.small
        : size === "medium"
          ? value.sizes?.medium
          : value.sizes?.full;
    const src = variant?.url ?? value.url;
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={value.alt || ""}
          width={variant?.width ?? value.width ?? undefined}
          height={variant?.height ?? value.height ?? undefined}
          className={sizeClass}
          loading="lazy"
        />
        {value.alt ? (
          <figcaption>
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
