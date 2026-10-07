import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSignups, getSubscriptions, getVisits, getWaitlist, lastDays } from "@/lib/dashboard";
import { SIGNUPS_OPEN } from "@/lib/launch";
import { getDailyCounts } from "@/lib/stats";

export const metadata: Metadata = { title: "Dashboard – Quairy", robots: { index: false } };

const RANGES = [7, 30, 90] as const;
const number = new Intl.NumberFormat("en");
const euros = new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const percent = (part: number, whole: number) =>
  whole > 0 ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format((part / whole) * 100)}%` : "–";

/** Settled value, or null with the failure logged, so one broken source doesn't blank the page. */
function value<T>(result: PromiseSettledResult<T>, source: string): T | null {
  if (result.status === "fulfilled") return result.value;
  console.error(`Dashboard: ${source} failed`, result.reason);
  return null;
}

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-display text-2xl tabular-nums">{value}</CardTitle>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </CardHeader>
    </Card>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number | null; note?: string }[] }) {
  const top = Math.max(1, ...steps.map((s) => s.value ?? 0));
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, i) => {
        const previous = steps[i - 1]?.value;
        return (
          <li key={step.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="tabular-nums">
                {step.value === null ? "Unavailable" : number.format(step.value)}
                {i > 0 && step.value !== null && previous != null && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {percent(step.value, previous)} of previous
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${((step.value ?? 0) / top) * 100}%` }}
              />
            </div>
            {step.note && <p className="text-xs text-muted-foreground">{step.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The owner's dashboard: visitors to subscribers in one funnel, plus daily
 * numbers. Only for users whose Clerk role is "admin" (checked in the layout).
 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  // The layout has already checked that this is an admin.
  const requested = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(requested) ? requested : 7;

  const [visitsResult, countsResult, signupsResult, subsResult, waitlistResult] =
    await Promise.allSettled([
      getVisits(days),
      getDailyCounts(days),
      getSignups(days),
      getSubscriptions(days),
      getWaitlist(days),
    ]);
  const visits = value(visitsResult, "Vercel Web Analytics");
  const counts = value(countsResult, "Redis stats");
  const signups = value(signupsResult, "Clerk");
  const subs = value(subsResult, "Stripe");
  const waitlist = value(waitlistResult, "Clerk waitlist");
  const searches = counts?.rows.reduce((sum, r) => sum + r.searches, 0) ?? null;
  const proSearches = counts?.rows.reduce((sum, r) => sum + r.proSearches, 0) ?? 0;
  const bots = counts?.rows.reduce((sum, r) => sum + r.botPreviews, 0) ?? null;
  const total = (field: "comparisons" | "textQuestions" | "sourceChecks" | "webSearches") =>
    counts?.rows.reduce((sum, r) => sum + r[field], 0) ?? null;
  const sourceChecks = total("sourceChecks");
  const webSearches = total("webSearches");
  const comparisons = total("comparisons");
  const textQuestions = total("textQuestions");
  const daysShown = lastDays(days).reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        <nav aria-label="Range" className="flex gap-1">
          {RANGES.map((r) => (
            <Button key={r} asChild size="sm" variant={r === days ? "secondary" : "ghost"}>
              <Link href={`/admin?days=${r}`} aria-current={r === days ? "page" : undefined}>
                {r} days
              </Link>
            </Button>
          ))}
        </nav>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>From visit to subscription</CardTitle>
          <CardDescription>The last {days} days, UTC.</CardDescription>
        </CardHeader>
        <CardContent>
          <Funnel
            steps={[
              {
                label: "Visitors",
                value: visits?.visitors ?? null,
                note: visits
                  ? "People, not bots. Counted per day, so a person who comes back on two days counts twice."
                  : "Add VERCEL_ANALYTICS_TOKEN to show visitors.",
              },
              {
                label: "Searchers",
                value: counts?.searchers ?? null,
                note: "Different people (by account, or IP when signed out) who ran at least one search.",
              },
              // While accounts and Pro are closed, the waitlist is the interest signal.
              ...(SIGNUPS_OPEN
                ? [
                    { label: "Sign-ups", value: signups?.inRange ?? null },
                    { label: "New subscribers", value: subs?.newInRange ?? null },
                  ]
                : [
                    {
                      label: "Joined the waitlist",
                      value: waitlist?.inRange ?? null,
                      note: waitlist ? `${number.format(waitlist.total)} on the waitlist in total.` : undefined,
                    },
                  ]),
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="Searches"
          value={searches === null ? "–" : number.format(searches)}
          detail={searches ? `${percent(proSearches, searches)} by Pro` : undefined}
        />
        <Tile
          label="Source checks"
          value={sourceChecks === null ? "–" : number.format(sourceChecks)}
          detail={webSearches === null ? undefined : `${number.format(webSearches)} paid web searches`}
        />
        <Tile
          label="Comparisons"
          value={comparisons === null ? "–" : number.format(comparisons)}
          detail={textQuestions === null ? undefined : `${number.format(textQuestions)} text questions`}
        />
        <Tile label="Bot link previews" value={bots === null ? "–" : number.format(bots)} />
        <Tile
          label="Page views"
          value={visits ? number.format(visits.pageviews) : "–"}
        />
        <Tile
          label="Active Pro"
          value={subs ? number.format(subs.active) : "–"}
          detail={subs ? `${subs.monthly} monthly, ${subs.yearly} yearly` : undefined}
        />
        <Tile
          label="Monthly revenue"
          value={subs ? euros.format(subs.mrr) : "–"}
          detail="Yearly plans spread over 12 months"
        />
        <Tile
          label="Cancelling or ended"
          value={subs ? `${subs.ending} · ${subs.endedInRange}` : "–"}
          detail={`Set to end · ended in ${days} days`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By day</CardTitle>
          <CardDescription>
            {signups ? `${number.format(signups.total)} accounts in total.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Day</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">Searchers</TableHead>
                <TableHead className="text-right">Searches</TableHead>
                <TableHead className="text-right" title="Source checks">Checks</TableHead>
                <TableHead className="text-right">Bots</TableHead>
                <TableHead className="text-right">{SIGNUPS_OPEN ? "Sign-ups" : "Waitlist"}</TableHead>
                <TableHead className="pr-6 text-right">Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daysShown.map((d) => {
                const row = counts?.rows.find((r) => r.day === d);
                const newSubs = subs?.newByDay[d] ?? 0;
                return (
                  <TableRow key={d}>
                    <TableCell className="pl-6">{d}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {visits ? (visits.byDay[d]?.visitors ?? 0) : "–"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row?.searchers ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row?.searches ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row?.sourceChecks ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row?.botPreviews ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {SIGNUPS_OPEN
                        ? signups
                          ? (signups.byDay[d] ?? 0)
                          : "–"
                        : waitlist
                          ? (waitlist.byDay[d] ?? 0)
                          : "–"}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {newSubs > 0 ? <Badge>{newSubs}</Badge> : subs ? 0 : "–"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
