import { describe, expect, it } from "vitest";
import { agreement } from "./agreement";
import type { Classification, Outcome } from "./jev";

const classification: Classification = {
  kind: "yes_no",
  confidence: 0.9,
  probabilities: { yes_no: 0.9, pick_one: 0, rate: 0, unsupported: 0.1 },
};
const yesNo = (yes: number): Outcome => ({ kind: "yes_no", classification, yes });
const pick = (choice: string): Outcome => ({
  kind: "pick_one",
  classification,
  choice,
  confidence: 0.8,
  options: [],
});
const levels = ["None", "A little", "Moderate", "A lot", "Extreme"];
const rate = (level: string): Outcome => ({
  kind: "rate",
  classification,
  level,
  confidence: 0.6,
  distribution: levels.map((label) => ({ label, probability: label === level ? 0.6 : 0.1 })),
  onScale: null,
});

describe("agreement", () => {
  it("compares yes/no answers by their lean", () => {
    expect(agreement(yesNo(0.9), yesNo(0.7))).toBe("agree");
    expect(agreement(yesNo(0.9), yesNo(0.2))).toBe("disagree");
    expect(agreement(yesNo(0.9), yesNo(0.55))).toBe("unclear");
  });

  it("compares picks", () => {
    expect(agreement(pick("Jupiter"), pick("Jupiter"))).toBe("agree");
    expect(agreement(pick("Jupiter"), pick("Mars"))).toBe("disagree");
  });

  it("treats neighbouring rating levels as mixed", () => {
    expect(agreement(rate("A lot"), rate("A lot"))).toBe("agree");
    expect(agreement(rate("A lot"), rate("Extreme"))).toBe("unclear");
    expect(agreement(rate("A little"), rate("Extreme"))).toBe("disagree");
  });

  it("can't compare different kinds", () => {
    expect(agreement(yesNo(0.9), pick("Jupiter"))).toBe("unclear");
  });
});
