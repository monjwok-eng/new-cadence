import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#14110f] px-6 text-center text-white">
      <p className="font-mono text-xs font-medium tracking-wider text-[#f94c1f]">
        404
      </p>
      <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        The page you requested could not be found. Return to the homepage or open your workspace dashboard.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-[6px] bg-[#f94c1f] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e13f15]"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-[6px] border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
