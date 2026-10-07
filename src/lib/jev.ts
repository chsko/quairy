import {
  choice,
  type ChoiceCriteria,
  noul,
  score,
  type ChoiceResponse,
  type Question,
  type Questions,
  type ResultFor,
  type SystemOneRequest,
  type SystemOneResult,
} from "@typesafe-ai/sdk";
import { extractOptions, extractScale, type Scale } from "./parse";
import { TRADEOFF, tradeoffQuestion } from "./compare";
import { passageId, tagPassages } from "./passages";

export const MAX_QUERY_LENGTH = 400;

/** The three kinds of question Jev answers, plus everything else. */
export const KIND_CRITERIA = {
  yes_no: {
    meaning: "A question whose answer is simply yes or no.",
    examples: ["Is the Pacific the largest ocean?", "Can penguins fly?"],
  },
  pick_one: {
    meaning:
      "A question asking which one of several alternatives is the answer, where the question itself lists every alternative.",
    examples: [
      "Which is the largest planet: Mars, Jupiter or Venus?",
      "Which is the better first programming language for kids, Python or C++?",
    ],
  },
  rate: {
    meaning:
      "A question asking how much of a gradable quality something has, answerable as a rating on a scale.",
    examples: [
      "How spicy is a jalapeño?",
      "On a scale of 1 to 10, how risky is skydiving?",
    ],
  },
  unsupported: {
    meaning:
      "Anything else: questions answered with a name, number, date, place, list, explanation or instructions; requests to choose without listing the alternatives; greetings, commands, or text that is not a question.",
    examples: [
      "Who wrote Hamlet?",
      "How tall is Mount Everest?",
      "How do I bake sourdough bread?",
      "What is the best laptop?",
    ],
  },
} satisfies ChoiceCriteria;

export type QuestionKind = keyof typeof KIND_CRITERIA;
export type SupportedKind = Exclude<QuestionKind, "unsupported">;

export const NONE_OF_THESE = "None of the listed options";

/**
 * Rating levels, lowest first. Jev judges each level on its own and never
 * sees its position, so each describes a situation rather than a number.
 */
export const RATING_LEVELS = [
  {
    label: "None",
    description: "The subject of `query` has none of the quality that `query` asks about.",
  },
  {
    label: "A little",
    description:
      "The subject of `query` has a little of the quality that `query` asks about, less than is typical.",
  },
  {
    label: "Moderate",
    description:
      "The subject of `query` has a typical, middling amount of the quality that `query` asks about.",
  },
  {
    label: "A lot",
    description:
      "The subject of `query` has a lot of the quality that `query` asks about, clearly more than is typical.",
  },
  {
    label: "Extreme",
    description:
      "The subject of `query` has an extreme amount of the quality that `query` asks about, about as much as anything has.",
  },
] as const;

export type Classification = {
  kind: QuestionKind;
  confidence: number;
  probabilities: Record<QuestionKind, number>;
};

/** Thresholds on the "does the text answer this" probability, from TypeSafe's line-by-line search cookbook. */
export const ANSWERED = 0.7;
export const NOT_ANSWERED = 0.35;

/** How an answer about a pasted text is backed by that text. */
export type Grounding = {
  /** Probability that the text answers the question. */
  answered: number;
  /** The text answers it, or only partly addresses it. */
  verdict: "answered" | "partial";
  /** The passages most likely to hold the answer, most probable first. */
  evidence: { index: number; text: string; probability: number }[];
};

type Grounded = { grounding?: Grounding };

export type Outcome =
  | ({
      kind: "yes_no";
      classification: Classification;
      /** Probability that the answer is yes. */
      yes: number;
    } & Grounded)
  | ({
      kind: "pick_one";
      classification: Classification;
      choice: string;
      confidence: number;
      /** Listed options and "none of them", most probable first. */
      options: { label: string; probability: number; none: boolean }[];
      /** A trade-off worth comparing on what matters to the asker (web searches only). */
      comparable?: boolean;
    } & Grounded)
  | ({
      kind: "rate";
      classification: Classification;
      /** The most probable level's label. */
      level: string;
      confidence: number;
      /** Every level, lowest first. */
      distribution: { label: string; probability: number }[];
      /** The most probable level placed on the scale the question named, rounded. */
      onScale: { scale: Scale; value: number } | null;
    } & Grounded)
  | {
      /** A question about a pasted text that the text does not answer. */
      kind: "not_in_text";
      classification: Classification;
      answered: number;
    }
  | {
      kind: "unsupported";
      classification: Classification;
      /** Why a question that looked answerable could not be asked. */
      reason?: string;
    };

/** The part of `TypeSafeClient` this module needs, so tests can supply a fake. */
export interface JevClient {
  systemOne(
    request: SystemOneRequest<Questions>,
  ): PromiseLike<SystemOneResult<Questions>>;
}

/**
 * Builds one request that classifies the query and, speculatively, answers it
 * as each kind that code could prepare. The answers run in parallel with the
 * classification; only the one matching the classification is used.
 *
 * With `passages`, answers come only from that text, and two more questions in
 * the same request ask whether the text answers the query and which passage
 * does (TypeSafe's line-by-line search pattern).
 */
export function buildRequest(query: string, passages?: string[], kind?: SupportedKind) {
  const options = extractOptions(query);
  const scale = extractScale(query);
  const basis = passages
    ? "Using only what `document` states or directly implies"
    : "Using well-established general knowledge";

  const questions: Questions = {
    kind: choice(
      "Which kind of question is `query`? Judge its form, not whether it is easy or true.",
      KIND_CRITERIA,
    ),
    yes_no: noul(
      `Assume \`query\` is a yes/no question. ${basis}, is the answer to \`query\` yes?`,
      { true: "The answer is yes.", false: "The answer is no." },
    ),
  };

  if (options) {
    const criteria: Record<string, null> = {};
    for (const option of options) criteria[option] = null;
    if (!options.some((o) => o.toLowerCase() === NONE_OF_THESE.toLowerCase())) {
      criteria[NONE_OF_THESE] = null;
    }
    // Speculative, for web searches: is this a trade-off worth comparing?
    if (!passages) questions.tradeoff = tradeoffQuestion();
    questions.pick_one = choice(
      `Assume \`query\` asks which one of the listed alternatives is the answer. ${basis}, which alternative best answers \`query\`? Choose the none option only if no listed alternative is a reasonable answer.`,
      criteria,
    );
  }

  const [lowest, next, ...higher] = RATING_LEVELS.map((level) => level.description);
  questions.rate = score(
    `Assume \`query\` asks how much of a quality its subject has. ${basis}, how much of that quality does the subject have?`,
    [lowest, next, ...higher],
  );

  if (passages) {
    questions.answered = noul("Does any line of `document` address or answer `query`?", {
      true: "At least one line of the document states or directly implies the answer.",
      false: "No line of the document addresses this.",
    });
    const lines: Record<string, null> = {};
    passages.forEach((_, i) => (lines[passageId(i)] = null));
    questions.where = choice("Which line of `document` contains the answer to `query`?", lines);
  }

  const request: SystemOneRequest<Questions> = {
    state: passages ? { query, document: tagPassages(passages) } : { query },
    questions,
  };
  return { request, options, scale, passages, kind };
}

function isType<T extends Question["type"]>(
  answer: ResultFor<Question> | undefined,
  type: T,
): answer is Extract<ResultFor<Question>, { type: T }> {
  return answer?.type === type;
}

/** Turns Jev's answers into what the page shows. */
export function interpret(
  built: ReturnType<typeof buildRequest>,
  result: SystemOneResult<Questions>,
): Outcome {
  const { answers } = result;
  const kindAnswer = answers.kind;
  if (!isType(kindAnswer, "choice")) {
    throw new Error("Jev did not classify the question.");
  }
  const kinds = kindAnswer as ChoiceResponse<typeof KIND_CRITERIA>;
  const classification: Classification = {
    // A known kind (re-asking a search from web sources) keeps the answer
    // comparable with the search's.
    kind: built.kind ?? kinds.choice,
    confidence: kinds.confidence,
    probabilities: { ...kinds.probabilities },
  };

  let grounding: Grounding | undefined;
  if (built.passages && classification.kind !== "unsupported") {
    const answered = answers.answered;
    const where = answers.where;
    if (!isType(answered, "noul") || !isType(where, "choice")) {
      throw new Error("Jev did not say where the text answers the question.");
    }
    if (answered.noul < NOT_ANSWERED) {
      return { kind: "not_in_text", classification, answered: answered.noul };
    }
    grounding = {
      answered: answered.noul,
      verdict: answered.noul >= ANSWERED ? "answered" : "partial",
      evidence: evidenceFrom(built.passages, where.probabilities as Record<string, number>),
    };
  }

  switch (classification.kind) {
    case "yes_no": {
      const answer = answers.yes_no;
      if (!isType(answer, "noul")) break;
      return { kind: "yes_no", classification, yes: answer.noul, grounding };
    }
    case "pick_one": {
      const answer = answers.pick_one;
      if (!built.options || !isType(answer, "choice")) {
        return {
          kind: "unsupported",
          classification,
          reason:
            "It looks like you want Quairy to pick between alternatives, but it couldn't find at least two listed after a colon.",
        };
      }
      const options = Object.entries(answer.probabilities)
        .map(([label, probability]) => ({
          label,
          probability,
          none: label === NONE_OF_THESE,
        }))
        .sort((a, b) => b.probability - a.probability);
      const tradeoff = answers.tradeoff;
      return {
        kind: "pick_one",
        classification,
        comparable: isType(tradeoff, "noul") ? tradeoff.noul >= TRADEOFF : undefined,
        choice: answer.choice,
        confidence: answer.confidence,
        options,
        grounding,
      };
    }
    case "rate": {
      const answer = answers.rate;
      if (!built.scale.ok) {
        return {
          kind: "unsupported",
          classification,
          reason: `It looks like you want a rating, but ${built.scale.reason.charAt(0).toLowerCase()}${built.scale.reason.slice(1)}`,
        };
      }
      if (!isType(answer, "score")) break;
      const probabilities = answer.probabilities as Record<string, number>;
      const distribution = RATING_LEVELS.map((level, i) => ({
        label: level.label,
        probability: probabilities[String(i)] ?? 0,
      }));
      // The most probable level, not the expected score: Jev's levels are not
      // calibrated for interpolating a magnitude between them.
      const top = distribution.reduce(
        (best, d, i) => (d.probability > distribution[best].probability ? i : best),
        0,
      );
      const { scale } = built.scale;
      const onScale = scale && {
        scale,
        value: Math.round(scale.min + (top / (RATING_LEVELS.length - 1)) * (scale.max - scale.min)),
      };
      return {
        kind: "rate",
        classification,
        level: distribution[top].label,
        confidence: answer.confidence,
        distribution,
        onScale,
        grounding,
      };
    }
    case "unsupported":
      return { kind: "unsupported", classification };
  }
  throw new Error(`Jev returned no answer for a ${classification.kind} question.`);
}

/** The most probable passage, plus any runner-up that is also fairly likely. */
function evidenceFrom(passages: string[], probabilities: Record<string, number>) {
  return passages
    .map((text, index) => ({ index, text, probability: probabilities[passageId(index)] ?? 0 }))
    .sort((a, b) => b.probability - a.probability)
    .filter((p, rank) => rank === 0 || (rank < 3 && p.probability >= 0.2));
}

/**
 * Classifies and answers a query with a single Jev request, from general
 * knowledge or, given `passages`, from that text alone. `kind` overrides the
 * classification when it is already known.
 */
export async function askJev(
  client: JevClient,
  query: string,
  passages?: string[],
  kind?: SupportedKind,
): Promise<Outcome> {
  const built = buildRequest(query, passages, kind);
  const result = await client.systemOne(built.request);
  return interpret(built, result);
}
