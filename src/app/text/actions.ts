"use server";

import { getJevClient } from "@/lib/client";
import { describeError } from "@/lib/errors";
import { askJev, MAX_QUERY_LENGTH, type Outcome } from "@/lib/jev";
import { MAX_TEXT_LENGTH, toPassages } from "@/lib/passages";
import { checkExtra } from "@/lib/quota";

export type TextAskState =
  | { status: "idle" }
  | { status: "answered"; id: number; outcome: Outcome }
  | { status: "error"; id: number; message: string }
  /** Today's comparisons, text questions and source checks are used up. */
  | { status: "limit"; id: number; limit: number; pro?: boolean };

/** Answers a question from a pasted text only, with the passage that answers it. */
export async function askAboutText(
  _previous: TextAskState,
  formData: FormData,
): Promise<TextAskState> {
  const id = Date.now();
  const text = String(formData.get("text") ?? "").trim();
  const question = String(formData.get("q") ?? "").trim();

  if (!text) return { status: "error", id, message: "Paste some text to ask about." };
  if (!question) return { status: "error", id, message: "Type a question about your text." };
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      status: "error",
      id,
      message: `Your text is too long. Keep it under ${MAX_TEXT_LENGTH.toLocaleString("en")} characters.`,
    };
  }
  if (question.length > MAX_QUERY_LENGTH) {
    return {
      status: "error",
      id,
      message: `Please keep questions under ${MAX_QUERY_LENGTH} characters.`,
    };
  }

  const access = await checkExtra("text", question, text);
  if (access.status === "slow_down") {
    return { status: "error", id, message: "That’s a lot of questions at once. Wait a minute, then try again." };
  }
  if (access.status === "limit") return { status: "limit", id, limit: access.limit, pro: access.pro };

  try {
    const outcome = await askJev(getJevClient(), question, toPassages(text));
    return { status: "answered", id, outcome };
  } catch (error) {
    console.error("Jev request about a pasted text failed", error);
    return { status: "error", id, message: describeError(error) };
  }
}
