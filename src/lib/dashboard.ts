import "server-only";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import { getStripe } from "./billing";
import { PRO_MONTHLY_EUR, PRO_YEARLY_EUR } from "./pricing";

// Numbers for the admin dashboard, each read live from where it's kept:
// Vercel Web Analytics (visitors), Clerk (sign-ups) and Stripe (subscriptions).
// Quairy's own search counts come from `getDailyCounts` in stats.ts.

/** Roles given in Clerk, as `{"role": "admin"}` in a user's public metadata. */
export type Role = "admin";

/**
 * Whether the signed-in user may see the dashboard: their Clerk public
 * metadata says `role: "admin"`. Only the Clerk dashboard or the secret key
 * can set public metadata, so users can't grant it to themselves. Read from
 * the session token when it carries the metadata (Clerk › Sessions ›
 * Customize session token: `{"metadata": "{{user.public_metadata}}"}`), else
 * from the user.
 */
export async function isAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return false;
  const role =
    sessionClaims?.metadata?.role ?? (await currentUser())?.publicMetadata?.role;
  return role === "admin";
}

/** The UTC days from `days - 1` days ago through today, as YYYY-MM-DD. */
export function lastDays(days: number) {
  return Array.from({ length: days }, (_, i) =>
    new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10),
  );
}

const dayOf = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 10);

// Not secrets: they only say which project to query; the token authorizes it.
const VERCEL_TEAM_ID = "team_Eu1c515YFZrSk6RuyYhzBWyO";
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? "prj_gRQc7dL5PrlqpUbgy0TmDVVw6Z6x";

export type Visits = {
  visitors: number;
  pageviews: number;
  byDay: Record<string, { visitors: number; pageviews: number }>;
};

/**
 * Human visitors and page views from Vercel Web Analytics (it leaves bots
 * out). Visitors are counted per day, so a range totals daily visitors.
 * Null without VERCEL_ANALYTICS_TOKEN.
 */
export async function getVisits(days: number): Promise<Visits | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) return null;
  const dates = lastDays(days);
  const params = new URLSearchParams({
    teamId: VERCEL_TEAM_ID,
    projectId: VERCEL_PROJECT_ID,
    since: dates[0],
    until: dates.at(-1)!,
    by: "day",
    limit: String(days + 1),
  });
  const response = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Vercel Web Analytics: ${response.status}`);
  const { data } = (await response.json()) as {
    data: { timestamp: string; visitors: number; pageviews: number }[];
  };
  const byDay: Visits["byDay"] = {};
  for (const row of data) byDay[row.timestamp.slice(0, 10)] = { visitors: row.visitors, pageviews: row.pageviews };
  return {
    visitors: data.reduce((sum, r) => sum + r.visitors, 0),
    pageviews: data.reduce((sum, r) => sum + r.pageviews, 0),
    byDay,
  };
}

export type Signups = { total: number; inRange: number; byDay: Record<string, number> };

/** Accounts created in the range, and all accounts, from Clerk. */
export async function getSignups(days: number): Promise<Signups> {
  const since = Date.parse(lastDays(days)[0]);
  const clerk = await clerkClient();
  const [total, recent] = await Promise.all([
    clerk.users.getCount(),
    clerk.users.getUserList({ createdAtAfter: since, orderBy: "-created_at", limit: 500 }),
  ]);
  const byDay: Record<string, number> = {};
  for (const user of recent.data) {
    const d = new Date(user.createdAt).toISOString().slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
  }
  return { total, inRange: recent.data.length, byDay };
}

export type Subscriptions = {
  active: number;
  monthly: number;
  yearly: number;
  /** Monthly recurring revenue in euros, with yearly plans spread over 12 months. */
  mrr: number;
  /** Set to end at the period's close, still active. */
  ending: number;
  newInRange: number;
  newByDay: Record<string, number>;
  endedInRange: number;
};

/**
 * Which of these Clerk user ids belong to the Clerk instance this deployment
 * uses. Until production has its own Stripe account, the Stripe sandbox also
 * holds subscriptions made from preview and local runs, whose users live in
 * Clerk's development instance; they're left out this way.
 */
async function usersOfThisInstance(ids: (string | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  const clerk = await clerkClient();
  const found = new Set<string>();
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await clerk.users.getUserList({ userId: unique.slice(i, i + 100), limit: 100 });
    for (const user of data) found.add(user.id);
  }
  return found;
}

/** Subscription counts and revenue from Stripe, for this Clerk instance's users. */
export async function getSubscriptions(days: number): Promise<Subscriptions> {
  const stripe = getStripe();
  const since = Math.floor(Date.parse(lastDays(days)[0]) / 1000);
  const result: Subscriptions = {
    active: 0,
    monthly: 0,
    yearly: 0,
    mrr: 0,
    ending: 0,
    newInRange: 0,
    newByDay: {},
    endedInRange: 0,
  };
  const all: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) all.push(sub);
  const ours = await usersOfThisInstance(all.map((sub) => sub.metadata.userId));
  for (const sub of all) {
    if (!ours.has(sub.metadata.userId)) continue;
    const live = ["active", "trialing", "past_due"].includes(sub.status);
    const yearly = sub.items.data[0]?.price.recurring?.interval === "year";
    if (live) {
      result.active++;
      if (yearly) result.yearly++;
      else result.monthly++;
      result.mrr += yearly ? PRO_YEARLY_EUR / 12 : PRO_MONTHLY_EUR;
      if (sub.cancel_at_period_end || sub.cancel_at) result.ending++;
    }
    // Checkout leaves an incomplete subscription behind when a payment fails; it never started.
    if (sub.created >= since && sub.status !== "incomplete" && sub.status !== "incomplete_expired") {
      result.newInRange++;
      const d = dayOf(sub.created);
      result.newByDay[d] = (result.newByDay[d] ?? 0) + 1;
    }
    if (sub.ended_at && sub.ended_at >= since) result.endedInRange++;
  }
  return result;
}
