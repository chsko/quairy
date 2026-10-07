"use client";

import { useActionState, ViewTransition } from "react";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import { checkTheSources, type SourcesState } from "@/app/search/actions";
import { ExtrasLimit } from "@/components/Limits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { agreement } from "@/lib/agreement";
import type { Outcome, SupportedKind } from "@/lib/jev";
import type { Source, SourceCheck as Check } from "@/lib/sources";
import { pct, summarize } from "@/lib/summary";

const AGREEMENT = {
  agree: { label: "Sources agree", variant: "secondary" },
  disagree: { label: "Sources point the other way", variant: "destructive" },
  unclear: { label: "Sources are mixed", variant: "outline" },
} as const;

function SourceLink({ source }: { source: Source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex max-w-full items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
    >
      <span className="truncate">{source.site}</span>
      <ExternalLinkIcon className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none">
        {sources.length} {sources.length === 1 ? "page" : "pages"} read
      </summary>
      <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="underline-offset-4 hover:underline">
              {s.title}
            </a>{" "}
            <span>· {s.site}{s.published ? ` · ${s.published}` : ""}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function Result({ check, search }: { check: Check; search: Outcome }) {
  const { outcome, sources, passageSources } = check;
  if (!outcome || outcome.kind === "unsupported") {
    return <p className="text-sm text-muted-foreground">Quairy couldn’t find web pages about this question.</p>;
  }
  if (outcome.kind === "not_in_text") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          The pages Quairy found don’t answer this question, so the answer above rests on general
          knowledge alone.
        </p>
        <SourceList sources={sources} />
      </div>
    );
  }

  const summary = summarize(outcome)!;
  const agreed = AGREEMENT[agreement(search, outcome)];
  const [best, ...others] = outcome.grounding?.evidence ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={agreed.variant}>{agreed.label}</Badge>
        {outcome.grounding?.verdict === "partial" && (
          <Badge variant="outline">They only partly answer this</Badge>
        )}
      </div>
      <p className="text-sm">
        From these pages: <span className="font-semibold">{summary.answer}</span>
        {summary.confidence !== undefined && (
          <span className="text-muted-foreground">, {pct(summary.confidence)}</span>
        )}
        .
      </p>
      {best && (
        <blockquote className="flex flex-col gap-1 border-l-2 border-primary pl-3 text-sm">
          {best.text}
          <SourceLink source={sources[passageSources[best.index]]} />
        </blockquote>
      )}
      {others.map((p) => (
        <blockquote key={p.index} className="flex flex-col gap-1 border-l-2 pl-3 text-sm text-muted-foreground">
          {p.text}
          <SourceLink source={sources[passageSources[p.index]]} />
        </blockquote>
      ))}
      <SourceList sources={sources} />
      <p className="text-xs text-muted-foreground">
        Excerpts from a web search. Open a source before relying on it.
      </p>
    </div>
  );
}

/**
 * "Check the sources" under a web answer: on request, Quairy searches the web
 * and answers again from what the pages say, with the excerpts it used.
 */
export function SourceCheck({ q, outcome }: { q: string; outcome: Extract<Outcome, { kind: SupportedKind }> }) {
  const [state, formAction, pending] = useActionState<SourcesState, FormData>(checkTheSources, {
    status: "idle",
  });

  if (state.status === "limit") return <ExtrasLimit limit={state.limit} pro={state.pro} />;

  return (
    <section aria-label="What web sources say" className="flex flex-col gap-3 border-t pt-4">
      {state.status === "checked" ? (
        <ViewTransition enter="reveal-in" default="none">
          <div className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-medium">What the web says</h3>
            <Result check={state.check} search={outcome} />
          </div>
        </ViewTransition>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="kind" value={outcome.kind} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button type="submit" variant="outline" size="sm" className="rounded-full" disabled={pending} aria-busy={pending}>
              {pending ? <Spinner data-icon="inline-start" aria-hidden="true" role="presentation" /> : <GlobeIcon data-icon="inline-start" />}
              {pending ? "Reading the web…" : "Check the sources"}
            </Button>
            {!pending && (
              <span className="text-xs text-muted-foreground">See what web pages say, with quotes.</span>
            )}
          </div>
          {pending && (
            <div className="flex flex-col gap-2" aria-hidden>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {state.status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
