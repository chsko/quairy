import "server-only";
import { createHash } from "node:crypto";
import Exa from "exa-js";
import { getJevClient } from "./client";
import { askJev, type Outcome, type SupportedKind } from "./jev";
import { getRedis } from "./redis";

// "Check the sources": a web search (Exa) finds pages about the question, and
// Jev answers again from their excerpts alone, pointing at the excerpt that
// holds the answer. It runs only when someone asks for it, never with a search.

/** Pages asked for, and the longest excerpt Jev reads from each. */
const MAX_SOURCES = 6;
const MAX_EXCERPT = 700;
const MAX_EXCERPTS_PER_SOURCE = 3;
/** Answers from sources are reused for a day: pages change slowly, and each check costs two API calls. */
const CACHE_SECONDS = 60 * 60 * 24;

export type Source = { title: string; url: string; site: string; published?: string };

export type SourceCheck = {
  sources: Source[];
  /** For each passage Jev read, the index of the source it came from. */
  passageSources: number[];
  /** Jev's answer from those passages only (`not_in_text` when they don't answer it); null when the search found nothing. */
  outcome: Outcome | null;
};

let exa: Exa | undefined;

function getExa() {
  // Reads EXA_API_KEY, which the Vercel Marketplace integration provides.
  exa ??= new Exa(process.env.EXA_API_KEY);
  return exa;
}

const siteOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

/** Excerpts too long for one passage are cut at a sentence end where possible. */
function trim(text: string) {
  if (text.length <= MAX_EXCERPT) return text;
  const cut = text.slice(0, MAX_EXCERPT);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return end > MAX_EXCERPT / 2 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

/** Web pages about `query`, with the excerpts most relevant to it. */
export async function findSources(query: string) {
  const { results } = await getExa().search(query, {
    type: "auto",
    numResults: MAX_SOURCES,
    contents: { highlights: true },
  });
  const sources: Source[] = [];
  const passages: string[] = [];
  const passageSources: number[] = [];
  for (const result of results) {
    const excerpts = (result.highlights ?? []).map(clean).filter((h) => h.length >= 40);
    if (excerpts.length === 0) continue;
    const index = sources.length;
    sources.push({
      title: clean(result.title ?? "") || siteOf(result.url),
      url: result.url,
      site: siteOf(result.url),
      published: result.publishedDate?.slice(0, 10),
    });
    for (const excerpt of excerpts.slice(0, MAX_EXCERPTS_PER_SOURCE)) {
      passages.push(trim(excerpt));
      passageSources.push(index);
    }
  }
  return { sources, passages, passageSources };
}

const cacheKey = (query: string, kind: SupportedKind) =>
  `sources:${kind}:${createHash("sha256").update(query.trim().toLowerCase()).digest("base64url").slice(0, 22)}`;

/**
 * Answers `query` again from web sources, as the same kind of question the
 * search answered. Cached for a day per question, keyed by its hash.
 */
export async function checkSources(query: string, kind: SupportedKind): Promise<SourceCheck> {
  const key = cacheKey(query, kind);
  try {
    const cached = await getRedis().get<SourceCheck>(key);
    if (cached) return cached;
  } catch (error) {
    console.error("Source cache read failed", error);
  }

  const { sources, passages, passageSources } = await findSources(query);
  const outcome = passages.length > 0 ? await askJev(getJevClient(), query, passages, kind) : null;
  const check: SourceCheck = { sources, passageSources, outcome };

  try {
    await getRedis().set(key, check, { ex: CACHE_SECONDS });
  } catch (error) {
    console.error("Source cache write failed", error);
  }
  return check;
}
