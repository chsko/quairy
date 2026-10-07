import type { Metadata } from "next";
import { PageTransition } from "@/components/Transitions";
import { TextAsk } from "./TextAsk";

export const metadata: Metadata = {
  alternates: { canonical: "/text" },
  title: "Ask about a text – Quairy",
  description:
    "Paste a text and ask a yes/no, pick-one or rating question. Quairy answers only from your text and shows where.",
};

export default function TextPage() {
  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
            Ask about a text
          </h1>
          <p className="max-w-prose text-muted-foreground text-pretty">
            Paste something and ask about it. Quairy answers only from what your text says, and
            shows you the line the answer comes from.
          </p>
        </div>
        <TextAsk />
      </div>
    </PageTransition>
  );
}
