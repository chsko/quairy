import type { Questions, SystemOneResult } from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import { askJev, buildRequest, NONE_OF_THESE, RATING_LEVELS, type JevClient } from "./jev";
import { extractOptions, extractScale } from "./parse";

describe("extractOptions", () => {
  it("reads options listed after a colon", () => {
    expect(
      extractOptions("Which is the largest planet: Mars, Jupiter, or Venus?"),
    ).toEqual(["Mars", "Jupiter", "Venus"]);
  });

  it("reads options listed after a question mark", () => {
    expect(extractOptions("Which is healthier? Apples or crisps")).toEqual([
      "Apples",
      "crisps",
    ]);
  });

  it("returns null when fewer than two options are listed", () => {
    expect(extractOptions("Is a tomato a fruit or a vegetable?")).toBeNull();
    expect(extractOptions("Which one: Mars?")).toBeNull();
  });

  it("drops duplicate options", () => {
    expect(extractOptions("Pick: tea, Tea or coffee")).toEqual(["tea", "coffee"]);
  });
});

describe("extractScale", () => {
  it.each([
    ["On a scale of 1 to 5, how spicy is a jalapeño?", 1, 5],
    ["How spicy is a jalapeño on a 0-10 scale?", 0, 10],
    ["Rate the risk from 1 to 7: skydiving", 1, 7],
    ["How loud is a jet engine (1-5)?", 1, 5],
    ["How good is pizza, out of 10?", 0, 10],
  ])("reads %s", (question, min, max) => {
    expect(extractScale(question)).toEqual({ ok: true, scale: { min, max } });
  });

  it("returns no scale when the question names none", () => {
    expect(extractScale("How risky is skydiving?")).toEqual({ ok: true, scale: null });
  });

  it("accepts wide scales and rejects backwards ones", () => {
    expect(extractScale("On a scale of 1 to 100, how hot is the sun?")).toEqual({
      ok: true,
      scale: { min: 1, max: 100 },
    });
    expect(extractScale("On a scale of 5 to 1, how hot is the sun?").ok).toBe(false);
  });
});

function fakeClient(
  answers: SystemOneResult<Questions>["answers"],
): JevClient & { requests: Questions[] } {
  const requests: Questions[] = [];
  return {
    requests,
    async systemOne(request) {
      requests.push(request.questions);
      return {
        model: "jev-test",
        answers,
        usage: { input_tokens: 1, output_tokens: 1 },
      };
    },
  };
}

function kind(choice: string) {
  const probabilities = { yes_no: 0.05, pick_one: 0.05, rate: 0.05, unsupported: 0.05, [choice]: 0.85 };
  return { type: "choice" as const, choice, confidence: 0.85, probabilities };
}

describe("buildRequest", () => {
  it("only asks the pick-one question when options were found", () => {
    expect(Object.keys(buildRequest("Can penguins fly?").request.questions)).toEqual([
      "kind",
      "yes_no",
      "rate",
    ]);
    const { questions } = buildRequest("Which is bigger: Mars or Venus?").request;
    expect(questions.tradeoff).toMatchObject({ type: "noul" });
    expect(questions.pick_one).toMatchObject({
      type: "choice",
      criteria: { Mars: null, Venus: null, [NONE_OF_THESE]: null },
    });
  });

  it("rates on the same descriptive levels whatever scale is named", () => {
    for (const q of ["How cold is Oslo?", "On a scale of 1 to 100, how cold is Oslo?"]) {
      const { questions } = buildRequest(q).request;
      expect(questions.rate).toMatchObject({
        type: "score",
        criteria: RATING_LEVELS.map((level) => level.description),
      });
    }
  });
});

describe("askJev", () => {
  const noulYes = { type: "noul" as const, noul: 0.1 };
  const rate = {
    type: "score" as const,
    score: 2.5,
    confidence: 0.6,
    legend: {},
    probabilities: { 0: 0.1, 1: 0.1, 2: 0.2, 3: 0.4, 4: 0.2 },
  };

  it("keeps a known kind and grounds the answer in the given passages", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("unsupported"),
        yes_no: { type: "noul", noul: 0.9 },
        rate,
        answered: { type: "noul", noul: 0.8 },
        where: { type: "choice", choice: "L001", confidence: 0.7, probabilities: { L000: 0.3, L001: 0.7 } },
      }),
      "Can penguins fly?",
      ["Penguins are birds.", "Penguins cannot fly."],
      "yes_no",
    );
    expect(outcome).toMatchObject({
      kind: "yes_no",
      yes: 0.9,
      grounding: { verdict: "answered", evidence: [{ index: 1 }, { index: 0 }] },
    });
  });

  it("answers yes/no questions", async () => {
    const outcome = await askJev(
      fakeClient({ kind: kind("yes_no"), yes_no: noulYes, rate }),
      "Can penguins fly?",
    );
    expect(outcome).toMatchObject({ kind: "yes_no", yes: 0.1 });
  });

  it("answers pick-one questions with options sorted by probability", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("pick_one"),
        yes_no: noulYes,
        rate,
        pick_one: {
          type: "choice",
          choice: "Jupiter",
          confidence: 0.9,
          probabilities: { Mars: 0.04, Jupiter: 0.9, [NONE_OF_THESE]: 0.06 },
        },
        tradeoff: { type: "noul", noul: 0.03 },
      }),
      "Which is the largest planet: Mars or Jupiter?",
    );
    expect(outcome).toMatchObject({ kind: "pick_one", choice: "Jupiter", comparable: false });
    if (outcome.kind !== "pick_one") throw new Error("unreachable");
    expect(outcome.options.map((o) => o.label)).toEqual(["Jupiter", NONE_OF_THESE, "Mars"]);
    expect(outcome.options[1].none).toBe(true);
  });

  it("offers a comparison only for trade-offs", async () => {
    const outcome = await askJev(
      fakeClient({
        kind: kind("pick_one"),
        yes_no: noulYes,
        rate,
        pick_one: {
          type: "choice",
          choice: "Python",
          confidence: 0.7,
          probabilities: { Python: 0.7, Rust: 0.25, [NONE_OF_THESE]: 0.05 },
        },
        tradeoff: { type: "noul", noul: 0.92 },
      }),
      "Which is better for a beginner: Python or Rust?",
    );
    expect(outcome).toMatchObject({ kind: "pick_one", comparable: true });
  });

  it("answers ratings with the most probable level", async () => {
    const outcome = await askJev(
      fakeClient({ kind: kind("rate"), yes_no: noulYes, rate }),
      "How cold is Oslo in January?",
    );
    expect(outcome).toMatchObject({ kind: "rate", level: "A lot", onScale: null });
    if (outcome.kind !== "rate") throw new Error("unreachable");
    expect(outcome.distribution[0]).toEqual({ label: "None", probability: 0.1 });
  });

  it("places the most probable level on the scale the question names", async () => {
    const outcome = await askJev(
      fakeClient({ kind: kind("rate"), yes_no: noulYes, rate }),
      "On a scale of 1 to 100, how cold is Oslo in January?",
    );
    // Level 3 of 0–4 is three quarters of the way from 1 to 100.
    expect(outcome).toMatchObject({ onScale: { scale: { min: 1, max: 100 }, value: 75 } });
  });

  it("explains unsupported questions", async () => {
    const outcome = await askJev(
      fakeClient({ kind: kind("unsupported"), yes_no: noulYes, rate }),
      "Who wrote Hamlet?",
    );
    expect(outcome).toMatchObject({ kind: "unsupported" });
  });

  it("asks for listed options when a pick-one question has none", async () => {
    const outcome = await askJev(
      fakeClient({ kind: kind("pick_one"), yes_no: noulYes, rate }),
      "Is a tomato a fruit or a vegetable?",
    );
    expect(outcome).toMatchObject({ kind: "unsupported", reason: expect.stringContaining("colon") });
  });

  it("explains a rating scale that can't be used", async () => {
    const outcome = await askJev(
      fakeClient({ kind: kind("rate"), yes_no: noulYes, rate }),
      "On a scale of 5 to 1, how hot is the sun?",
    );
    expect(outcome).toMatchObject({
      kind: "unsupported",
      reason: expect.stringContaining("lower to a higher"),
    });
  });
});
