"use server";

import { ExaError } from "exa-js";
import { describeError } from "@/lib/errors";
import { MAX_QUERY_LENGTH, type SupportedKind } from "@/lib/jev";
import { checkExtra } from "@/lib/quota";
import { checkSources, type SourceCheck } from "@/lib/sources";
import { trackEvent } from "@/lib/stats";

export type SourcesState =
  | { status: "idle" }
  | { status: "checked"; check: SourceCheck }
  | { status: "error"; message: string }
  /** Today's comparisons, text questions and source checks are used up. */
  | { status: "limit"; limit: number; pro?: boolean };

const KINDS: readonly string[] = ["yes_no", "pick_one", "rate"] satisfies SupportedKind[];

/**
 * Answers a search again from web sources, on request only: each check costs a
 * web search and a larger Jev request, so it shares the extras allowance.
 */
export async function checkTheSources(
  _previous: SourcesState,
  formData: FormData,
): Promise<SourcesState> {
  const q = String(formData.get("q") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  if (!q || q.length > MAX_QUERY_LENGTH || !KINDS.includes(kind)) {
    return { status: "error", message: "Quairy can’t check the sources for this question." };
  }
  if (!process.env.EXA_API_KEY) {
    return { status: "error", message: "Checking sources isn’t available yet." };
  }

  const access = await checkExtra("sources", q);
  if (access.status === "slow_down") {
    return { status: "error", message: "That’s a lot of questions at once. Wait a minute, then try again." };
  }
  if (access.status === "limit") return { status: "limit", limit: access.limit, pro: access.pro };

  try {
    const check = await checkSources(q, kind as SupportedKind);
    await trackEvent("Check sources", { plan: access.plan });
    return { status: "checked", check };
  } catch (error) {
    console.error("Source check failed", error);
    const message =
      error instanceof ExaError
        ? "Quairy couldn’t search the web right now. Please try again."
        : describeError(error);
    return { status: "error", message };
  }
}
