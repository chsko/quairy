import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ScaleIcon } from "lucide-react";
import { ViewTransition } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { ExtrasLimit, SlowDown } from "@/components/Limits";
import { NAV_BACK } from "@/components/Transitions";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getJevClient } from "@/lib/client";
import { compare, compareSetup, type CompareResult } from "@/lib/compare";
import { describeError } from "@/lib/errors";
import { MAX_QUERY_LENGTH } from "@/lib/jev";
import { checkExtra } from "@/lib/quota";
import { CompareView } from "./CompareView";

type Props = PageProps<"/search/compare">;

async function readQuery(searchParams: Props["searchParams"]) {
  const q = (await searchParams).q;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  // Like search results, comparisons stay out of search engines.
  return {
    title: q ? `Compare: ${q} – Quairy` : "Compare – Quairy",
    robots: { index: false, follow: true },
  };
}

export default async function ComparePage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  if (!q) redirect("/");
  if (q.length > MAX_QUERY_LENGTH) {
    return <ErrorCard message={`Please keep questions under ${MAX_QUERY_LENGTH} characters.`} />;
  }
  const setup = compareSetup(q);
  if (!setup.ok) return <ErrorCard title="Nothing to compare" message={setup.reason} />;

  const access = await checkExtra("compare", q);
  if (access.status === "slow_down") return <SlowDown />;
  if (access.status === "limit") return <ExtrasLimit limit={access.limit} />;

  let result: CompareResult;
  try {
    result = await compare(getJevClient(), q, setup.options);
  } catch (error) {
    console.error("Jev comparison failed", error);
    return <ErrorCard message={describeError(error)} />;
  }
  if (result.status !== "ready") {
    return (
      <NothingToWeigh
        query={q}
        message={
          result.status === "factual"
            ? "This question has one factual answer, so there’s nothing to weigh up. Comparing works for choices that depend on what you care about, like “Which laptop is best for students: MacBook Air or ThinkPad?”"
            : "Quairy couldn’t find enough everyday factors that apply to these options, so a comparison wouldn’t say much."
        }
      />
    );
  }
  const { comparison } = result;
  return (
    <ViewTransition key={q} enter="reveal-in" default="none">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
          <span className="sr-only">Comparing: </span>
          {q}
        </h1>
        <CompareView comparison={comparison} />
      </div>
    </ViewTransition>
  );
}

function NothingToWeigh({ query, message }: { query: string; message: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScaleIcon />
        </EmptyMedia>
        <EmptyTitle>Nothing to compare here</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/search?${new URLSearchParams({ q: query })}`} transitionTypes={[NAV_BACK]}>
            See the answer
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
