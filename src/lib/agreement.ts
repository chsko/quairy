import type { Outcome } from "./jev";

/** Whether the sources' answer matches the search's, for the agreement badge. */
export function agreement(search: Outcome, sources: Outcome): "agree" | "disagree" | "unclear" {
  if (search.kind === "yes_no" && sources.kind === "yes_no") {
    const close = (p: number) => p > 0.4 && p < 0.6;
    if (close(search.yes) || close(sources.yes)) return "unclear";
    return search.yes >= 0.5 === sources.yes >= 0.5 ? "agree" : "disagree";
  }
  if (search.kind === "pick_one" && sources.kind === "pick_one") {
    return search.choice === sources.choice ? "agree" : "disagree";
  }
  if (search.kind === "rate" && sources.kind === "rate") {
    const levels = sources.distribution.map((d) => d.label);
    const gap = Math.abs(levels.indexOf(search.level) - levels.indexOf(sources.level));
    return gap === 0 ? "agree" : gap === 1 ? "unclear" : "disagree";
  }
  return "unclear";
}
