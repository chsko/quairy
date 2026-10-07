import Link from "next/link";
import { HourglassIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PRO_OPEN } from "@/lib/launch";
import { PRO_PRICE_LABEL } from "@/lib/pricing";

function UpgradeButton() {
  return (
    <Button asChild className="rounded-full">
      <Link href="/pro">
        <SparklesIcon data-icon="inline-start" />
        {PRO_OPEN ? `Go unlimited with Pro for ${PRO_PRICE_LABEL}` : "Unlimited Pro is coming soon"}
      </Link>
    </Button>
  );
}

function LimitCard({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HourglassIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <UpgradeButton />
      </EmptyContent>
    </Empty>
  );
}

/** Shown instead of an answer once a free visitor has used today's searches. */
export function SearchLimit({ limit }: { limit: number }) {
  return (
    <LimitCard
      title={`You’ve used today’s ${limit} free searches`}
      description={`New free searches arrive at midnight UTC. Questions you already asked today still work. Quairy Pro${PRO_OPEN ? "" : ", coming soon,"} has no daily limit and keeps your search history.`}
    />
  );
}

/**
 * Shown instead of a comparison, a text answer or a source check once today's
 * free ones are used, or once a subscriber reaches Pro's fair-use cap.
 */
export function ExtrasLimit({ limit, pro }: { limit: number; pro?: boolean }) {
  if (pro) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HourglassIcon />
          </EmptyMedia>
          <EmptyTitle>You’ve reached today’s fair-use limit</EmptyTitle>
          <EmptyDescription>
            Pro includes up to {limit} comparisons, text questions and source checks a day, which
            renews at midnight UTC. Searches aren’t affected, and ones you already ran today still
            work.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <LimitCard
      title={`You’ve used today’s ${limit} free comparisons, text questions and source checks`}
      description={`They share one daily allowance, which renews at midnight UTC. Ones you already ran today still work, and searches aren’t affected. Quairy Pro${PRO_OPEN ? "" : ", coming soon,"} has no daily limits.`}
    />
  );
}

/** Shown when one address sends too many requests in a short time. */
export function SlowDown() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HourglassIcon />
        </EmptyMedia>
        <EmptyTitle>That’s a lot of questions at once</EmptyTitle>
        <EmptyDescription>Wait a minute, then try again.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/** A quiet note under an answer when a free visitor is running low. */
export function FreeSearchesLeft({ remaining }: { remaining: number }) {
  return (
    <p className="mt-4 text-center text-sm text-muted-foreground">
      {remaining === 0
        ? "That was your last free search today."
        : `${remaining} free ${remaining === 1 ? "search" : "searches"} left today.`}{" "}
      <Link href="/pro" className="font-medium text-foreground underline-offset-4 hover:underline">
        {PRO_OPEN ? "Go unlimited with Pro" : "Unlimited Pro is coming soon"}
      </Link>
    </p>
  );
}
