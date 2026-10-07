import { SiteHeader } from "@/components/SiteHeader";
import { PrefetchRoutes } from "@/components/PrefetchRoutes";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A stand-in for Clerk's sign-in and sign-up card, passed to the card as its
 * `fallback` so it shows until the card has mounted.
 */
export function AuthCardSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex h-fit w-full max-w-100 flex-col items-center gap-4 rounded-xl border bg-card p-10"
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-56" />
      <Skeleton className="mt-4 h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

/**
 * The sign-in and sign-up pages. Clerk downloads each card's code the first
 * time it's shown, so the card gets an `AuthCardSkeleton` as its `fallback`.
 * Clerk's links between the two pages aren't Next.js links, so `prefetch`
 * warms the other one.
 */
export function AuthPage({
  prefetch,
  footnote,
  children,
}: {
  prefetch?: string;
  /** A line under the card, such as the terms people agree to. */
  footnote?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col items-center gap-4 px-4 py-12">
        {children}
        {footnote && (
          <p className="max-w-100 text-center text-xs text-muted-foreground">{footnote}</p>
        )}
      </main>
      {prefetch && <PrefetchRoutes routes={[prefetch]} />}
    </>
  );
}
