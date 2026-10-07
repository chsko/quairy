import Link from "next/link";
import { FileSearchIcon, MessageCircleQuestionIcon, SlidersHorizontalIcon } from "lucide-react";
import { ExampleQuestions } from "@/components/ExampleQuestions";
import { RatingChart } from "@/components/RatingChart";
import { ShareButton } from "@/components/ShareButton";
import { SourceCheck } from "@/components/SourceCheck";
import { NAV_FORWARD } from "@/components/Transitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { EXAMPLES } from "@/lib/examples";
import { MAX_COMPARE_OPTIONS } from "@/lib/compare";
import type { Grounding, Outcome, SupportedKind } from "@/lib/jev";
import { KIND_LABEL, pct, summarize } from "@/lib/summary";
import { cn } from "@/lib/utils";


function Evidence({ grounding }: { grounding: Grounding }) {
  const [best, ...others] = grounding.evidence;
  return (
    <section aria-label="From your text" className="flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-sm font-medium">From your text</h3>
        {grounding.verdict === "partial" && (
          <Badge variant="outline">Your text only partly answers this</Badge>
        )}
      </div>
      <blockquote className="border-l-2 border-primary pl-3 text-sm">
        {best.text}
        <span className="mt-1 block text-xs text-muted-foreground">
          {pct(best.probability)} likely to hold the answer
        </span>
      </blockquote>
      {others.map((p) => (
        <blockquote key={p.index} className="border-l-2 pl-3 text-sm text-muted-foreground">
          {p.text}
          <span className="mt-1 block text-xs">Also relevant, {pct(p.probability)}</span>
        </blockquote>
      ))}
    </section>
  );
}

function AnswerCard({
  outcome,
  shareable,
  q,
  children,
}: {
  outcome: Extract<Outcome, { kind: SupportedKind }>;
  /** Offer a Share button; answers about a pasted text stay private. */
  shareable: boolean;
  /** The web search, which can be checked against web sources. */
  q?: string;
  children: React.ReactNode;
}) {
  const summary = summarize(outcome)!;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{KIND_LABEL[outcome.kind]} question</CardDescription>
        <CardTitle className="font-display text-4xl font-bold tracking-tight break-words">
          {summary.answer}
        </CardTitle>
        <CardDescription>{summary.detail}</CardDescription>
        {shareable && (
          <CardAction>
            <ShareButton />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {children}
        {outcome.grounding && <Evidence grounding={outcome.grounding} />}
        {q && !outcome.grounding && <SourceCheck q={q} outcome={outcome} />}
      </CardContent>
      <CardFooter className="flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <Badge variant="secondary" title="How sure Quairy is about the kind of question">
          Read as {KIND_LABEL[outcome.kind].toLowerCase()}, {pct(outcome.classification.confidence)}
        </Badge>
        {outcome.grounding
          ? "Based only on the text you pasted."
          : "Based on general knowledge, not a cited source."}
      </CardFooter>
    </Card>
  );
}

function ProbabilityRow({
  label,
  probability,
  muted,
}: {
  label: string;
  probability: number;
  muted?: boolean;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] sm:grid-cols-[minmax(0,14rem)_1fr_3.5rem] items-center gap-3 text-sm">
      <span className={cn("truncate", muted && "text-muted-foreground italic")} title={label}>
        {label}
      </span>
      <Progress value={probability * 100} aria-label={`${label}: ${pct(probability)}`} />
      <span className="text-right tabular-nums">{pct(probability)}</span>
    </li>
  );
}

function NotInText() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearchIcon />
        </EmptyMedia>
        <EmptyTitle>Your text doesn’t say</EmptyTitle>
        <EmptyDescription>
          Quairy answers only from the text you pasted, and nothing in it addresses this
          question. Try asking about something the text covers.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function Guidance({
  reason,
  examples = true,
}: {
  reason?: string;
  /** Show example searches; off when asking about a pasted text. */
  examples?: boolean;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>Quairy can’t answer that yet</EmptyTitle>
        <EmptyDescription>
          {reason ?? "Quairy answers three kinds of question. Rephrase yours as one of these:"}
          {reason && " Quairy answers three kinds of question:"}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-xl items-stretch gap-6 text-left">
        {(Object.keys(EXAMPLES) as SupportedKind[]).map((kind) => {
          const { label, description, questions } = EXAMPLES[kind];
          return (
            <div key={kind} className="flex flex-col gap-2">
              <div>
                <h2 className="font-display font-semibold">{label}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {examples && <ExampleQuestions questions={questions} />}
            </div>
          );
        })}
      </EmptyContent>
    </Empty>
  );
}

export function Answer({
  outcome,
  mode = "web",
  q,
  compareHref,
}: {
  outcome: Outcome;
  /** "text" when answering from a pasted text. */
  mode?: "web" | "text";
  /** The web search, for "Check the sources". */
  q?: string;
  /** Where a pick-one answer can be compared in detail. */
  compareHref?: string;
}) {
  const shareable = mode === "web";
  const card = { shareable, q: mode === "web" ? q : undefined };
  switch (outcome.kind) {
    case "unsupported":
      return <Guidance reason={outcome.reason} examples={mode === "web"} />;
    case "not_in_text":
      return <NotInText />;
    case "yes_no":
      return (
        <AnswerCard outcome={outcome} {...card}>
          <ul className="flex flex-col gap-3">
            <ProbabilityRow label="Yes" probability={outcome.yes} />
            <ProbabilityRow label="No" probability={1 - outcome.yes} />
          </ul>
        </AnswerCard>
      );
    case "pick_one":
      return (
        <AnswerCard outcome={outcome} {...card}>
          <ul className="flex flex-col gap-3">
            {outcome.options.map((o) => (
              <ProbabilityRow key={o.label} label={o.label} probability={o.probability} muted={o.none} />
            ))}
          </ul>
          {compareHref &&
            outcome.comparable &&
            outcome.options.filter((o) => !o.none).length <= MAX_COMPARE_OPTIONS && (
              <Button asChild variant="outline" size="sm" className="self-start rounded-full">
                <Link href={compareHref} transitionTypes={[NAV_FORWARD]}>
                  <SlidersHorizontalIcon data-icon="inline-start" />
                  Compare on what matters to you
                </Link>
              </Button>
            )}
        </AnswerCard>
      );
    case "rate":
      return (
        <AnswerCard outcome={outcome} {...card}>
          <RatingChart distribution={outcome.distribution} />
        </AnswerCard>
      );
  }
}
