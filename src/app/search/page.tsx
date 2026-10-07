import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userAgent } from "next/server";
import { ViewTransition } from "react";
import { Answer } from "@/components/Answer";
import { ErrorCard } from "@/components/ErrorCard";
import { FreeSearchesLeft, SearchLimit, SlowDown } from "@/components/Limits";
import { describeError } from "@/lib/errors";
import { MAX_QUERY_LENGTH, type Outcome } from "@/lib/jev";
import { checkSearch } from "@/lib/quota";
import { search } from "@/lib/search";
import { SITE_DESCRIPTION } from "@/lib/site";
import { summarize } from "@/lib/summary";

type Props = PageProps<"/search">;

async function readQuery(searchParams: Props["searchParams"]) {
  const q = (await searchParams).q;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

/**
 * Search results stay out of search engines: they're endless, made on demand
 * (each crawl would ask Jev), and thin on their own. Links in them can be followed.
 */
const NOT_INDEXED = { index: false, follow: true } as const;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  if (!q || q.length > MAX_QUERY_LENGTH) return { title: "Quairy", robots: NOT_INDEXED };

  // Link previews show the answer: the description here, and the card image,
  // which /card renders from the same question.
  // A page’s Open Graph fields replace the layout’s, so fall back explicitly.
  let description = SITE_DESCRIPTION;
  // Only link-preview bots read it. For people, metadata also runs when a link
  // to this page is prefetched, which must not ask Jev, count a search or
  // stamp the question in their history.
  if (userAgent({ headers: await headers() }).isBot) {
    try {
      if ((await checkSearch(q)).status !== "ok") throw new Error("Not allowed");
      const summary = summarize(await search(q));
      if (summary) description = `${summary.answer}. ${summary.detail}`;
    } catch {
      // The preview falls back to the site description.
    }
  }
  const title = `${q} – Quairy`;
  const image = { url: `/card?${new URLSearchParams({ q })}`, width: 1200, height: 630, alt: title };
  return {
    title,
    robots: NOT_INDEXED,
    description,
    openGraph: { siteName: "Quairy", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  if (!q) redirect("/");

  if (q.length > MAX_QUERY_LENGTH) {
    return <ErrorCard message={`Please keep questions under ${MAX_QUERY_LENGTH} characters.`} />;
  }

  const access = await checkSearch(q);
  if (access.status === "limit") return <SearchLimit limit={access.limit} />;
  if (access.status === "slow_down") return <SlowDown />;

  let outcome: Outcome;
  try {
    outcome = await search(q);
  } catch (error) {
    console.error("Jev request failed", error);
    return <ErrorCard message={describeError(error)} />;
  }
  return (
    // Keyed by the query so each new answer rises in, including searches made
    // from the results header.
    <ViewTransition key={q} enter="reveal-in" default="none">
      <div>
        <h1 className="sr-only">Quairy’s answer to “{q}”</h1>
        <Answer
          outcome={outcome}
          compareHref={`/search/compare?${new URLSearchParams({ q })}`}
        />
        {access.remaining !== undefined && access.remaining <= 3 && (
          <FreeSearchesLeft remaining={access.remaining} />
        )}
      </div>
    </ViewTransition>
  );
}
