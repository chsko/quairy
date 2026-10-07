import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { HistoryIcon, SparklesIcon } from "lucide-react";
import { NAV_FORWARD } from "@/components/Transitions";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getSubscription, isPro } from "@/lib/billing";
import { PRO_OPEN } from "@/lib/launch";
import { getHistory, getTimePreferences } from "@/lib/quota";
import { clearSearchHistory } from "./actions";
import { RememberTimePreferences, SearchTime } from "@/components/TimePreferences";

export const metadata: Metadata = { title: "Search history – Quairy", robots: { index: false } };

function Notice({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HistoryIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{action}</EmptyContent>
    </Empty>
  );
}

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId || !isPro(await getSubscription(userId))) {
    return (
      <Notice
        title={PRO_OPEN ? "Search history is part of Pro" : "Search history is coming with Pro"}
        description={`With Quairy Pro${PRO_OPEN ? "" : ", coming soon"}, every question you ask is kept here so you can open it again.`}
        action={
          <Button asChild className="rounded-full">
            <Link href="/pro">
              <SparklesIcon data-icon="inline-start" />
              See Quairy Pro
            </Link>
          </Button>
        }
      />
    );
  }

  const [history, time] = await Promise.all([getHistory(userId), getTimePreferences(userId)]);
  if (history.length === 0) {
    return (
      <Notice
        title="No searches yet"
        description="Questions you ask will show up here."
        action={
          <Button asChild className="rounded-full">
            <Link href="/">Ask a question</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Search history</h1>
        <form action={clearSearchHistory}>
          <Button type="submit" variant="ghost" size="sm">
            Clear history
          </Button>
        </form>
      </div>
      <ul className="flex flex-col divide-y rounded-xl border bg-card">
        {history.map(({ q, at }) => (
          <li key={q}>
            <Link
              href={`/search?${new URLSearchParams({ q })}`}
              transitionTypes={[NAV_FORWARD]}
              className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
            >
              <span className="break-words">{q}</span>
              <span className="text-xs text-muted-foreground">
                <SearchTime at={at} saved={time} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        <RememberTimePreferences saved={time} />
        Times are shown in {time.timeZone ? time.timeZone.replaceAll("_", " ") : "your time zone"}.{" "}
        <Link
          href="/settings/preferences"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Change
        </Link>
      </p>
    </div>
  );
}
