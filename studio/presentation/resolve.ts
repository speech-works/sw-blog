import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";

// Maps a document to the front-end URL(s) where it appears, so the Presentation
// tool knows what to render and can drive click-to-edit. Post URLs live at the
// site root (/<slug>).
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    post: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug
            ? [{ title: doc.title || "Untitled", href: `/${doc.slug}` }]
            : []),
          { title: "All articles", href: "/" },
        ],
      }),
    }),
  },
};
