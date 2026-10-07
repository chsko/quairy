import "server-only";
import { headers } from "next/headers";
import { after } from "next/server";
import { track } from "@vercel/analytics/server";
import { getRedis } from "./redis";

// Quairy's own usage numbers for the admin dashboard, kept in Redis per UTC
// day: how many searches ran, how many link-preview bots asked, and roughly
// how many different people searched (a HyperLogLog, which keeps no ids).
// Business events also go to Vercel Web Analytics as custom events.

const DAY_TTL = 60 * 60 * 24 * 120;
const day = (date = new Date()) => date.toISOString().slice(0, 10);
// Kept apart per environment: preview and local runs share the Redis database
// with production, and their test searches mustn't count in its numbers.
const ENV = process.env.VERCEL_ENV ?? "development";
const countsKey = (d: string) => `stats:${ENV}:${d}`;
const searchersKey = (d: string) => `stats:${ENV}:searchers:${d}`;

export type DailyCounts = {
  day: string;
  searches: number;
  proSearches: number;
  botPreviews: number;
  searchers: number;
};

/** Counts a search that ran for a person, and who (by an anonymous id) ran it. */
export async function recordSearch(visitor: string, plan: "free" | "pro") {
  const d = day();
  try {
    const pipe = getRedis().pipeline();
    pipe.hincrby(countsKey(d), "searches", 1);
    if (plan === "pro") pipe.hincrby(countsKey(d), "proSearches", 1);
    pipe.pfadd(searchersKey(d), visitor);
    pipe.expire(countsKey(d), DAY_TTL);
    pipe.expire(searchersKey(d), DAY_TTL);
    await pipe.exec();
  } catch (error) {
    console.error("Couldn't record search stats", error);
  }
  await trackEvent("Search", { plan });
}

/** Counts a link-preview bot fetching a search page. */
export async function recordBotPreview() {
  const d = day();
  try {
    await getRedis().pipeline().hincrby(countsKey(d), "botPreviews", 1).expire(countsKey(d), DAY_TTL).exec();
  } catch (error) {
    console.error("Couldn't record bot stats", error);
  }
}

/** The last `days` days of counts, oldest first, plus distinct searchers across them all. */
export async function getDailyCounts(days: number) {
  const dates = Array.from({ length: days }, (_, i) => day(new Date(Date.now() - (days - 1 - i) * 864e5)));
  const redis = getRedis();
  const pipe = redis.pipeline();
  for (const d of dates) {
    pipe.hgetall(countsKey(d));
    pipe.pfcount(searchersKey(d));
  }
  pipe.pfcount(...(dates.map(searchersKey) as [string, ...string[]]));
  const results = await pipe.exec<unknown[]>();
  const rows: DailyCounts[] = dates.map((d, i) => {
    const counts = (results[i * 2] ?? {}) as Record<string, number | string>;
    return {
      day: d,
      searches: Number(counts.searches ?? 0),
      proSearches: Number(counts.proSearches ?? 0),
      botPreviews: Number(counts.botPreviews ?? 0),
      searchers: Number(results[i * 2 + 1] ?? 0),
    };
  });
  return { rows, searchers: Number(results.at(-1) ?? 0) };
}

/**
 * Sends a custom event to Vercel Web Analytics after the response, so a slow
 * or failed send never holds anything up.
 */
export async function trackEvent(name: string, data?: Record<string, string | number | boolean | null>) {
  try {
    // Request headers must be read during the request, not inside `after`.
    const requestHeaders = new Headers(await headers());
    after(async () => {
      try {
        await track(name, data, { headers: requestHeaders });
      } catch (error) {
        console.error(`Couldn't track ${name}`, error);
      }
    });
  } catch (error) {
    console.error(`Couldn't track ${name}`, error);
  }
}
