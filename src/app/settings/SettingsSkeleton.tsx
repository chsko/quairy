import { Skeleton } from "@/components/ui/skeleton";

/**
 * Holds the dashboard's place: while the page loads (`loading.tsx`), and as
 * Clerk's `fallback` until its profile card mounts.
 */
export function SettingsSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading settings…"
      className={`flex min-h-[28rem] w-full rounded-xl border bg-card ${className ?? ""}`}
    >
      <div className="hidden w-52 shrink-0 flex-col gap-3 border-r p-6 sm:flex">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-4 h-7 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-8">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  );
}
