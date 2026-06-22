import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-6 pt-28 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-app-title md:text-4xl">
        We couldn&apos;t find that article
      </h1>
      <p className="mt-4 text-gray-600">
        It may have moved or never existed. Browse the latest writing instead.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-brand-600 hover:shadow-lg"
      >
        Back to the blog
      </Link>
    </main>
  );
}
