import { getAllPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";

// Time-based ISR: the index re-renders at most once a minute, and the publish
// webhook (/api/revalidate) refreshes it instantly. New posts never rebuild a repo.
export const revalidate = 60;

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <main className="relative mx-auto max-w-6xl px-5 pt-14 sm:px-6 lg:px-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
          The Speechworks Blog
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-app-title md:text-5xl">
          Notes from the clinical community
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-600">
          Practical, evidence-informed writing from speech-language pathologists on
          fluency, therapy, and communication in the real world.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md rounded-3xl border border-dashed border-brand/30 bg-brand-50/50 p-10 text-center">
          <p className="text-lg font-semibold text-app-title">No posts yet</p>
          <p className="mt-2 text-sm text-app-muted">
            New articles will appear here as our SLPs publish them.
          </p>
        </div>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
