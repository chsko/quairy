"use client";

import { useActionState, useState, ViewTransition } from "react";
import { AlertCircleIcon } from "lucide-react";
import { Answer } from "@/components/Answer";
import { ExtrasLimit } from "@/components/Limits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MAX_QUERY_LENGTH } from "@/lib/jev";
import { MAX_TEXT_LENGTH } from "@/lib/passages";
import { EXAMPLE_TEXT, EXAMPLE_TEXT_QUESTIONS } from "@/lib/textExample";
import { askAboutText, type TextAskState } from "./actions";

const count = new Intl.NumberFormat("en");

export function TextAsk() {
  const [state, formAction, pending] = useActionState<TextAskState, FormData>(askAboutText, {
    status: "idle",
  });
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const tooLong = text.length > MAX_TEXT_LENGTH;
  const ready = text.trim() !== "" && question.trim() !== "" && !tooLong;

  function fillExample(q: string) {
    setText(EXAMPLE_TEXT);
    setQuestion(q);
  }

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction}>
        <FieldGroup>
          <Field data-invalid={tooLong || undefined}>
            <FieldLabel htmlFor="text">Your text</FieldLabel>
            <Textarea
              id="text"
              name="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={9}
              aria-invalid={tooLong || undefined}
              placeholder="Paste an article, terms and conditions, an email or your notes…"
              className="max-h-[50vh] min-h-40"
            />
            <FieldDescription className="tabular-nums">
              {count.format(text.length)} / {count.format(MAX_TEXT_LENGTH)} characters
              {tooLong && ". Shorten your text to ask about it."}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="q">Your question</FieldLabel>
            <InputGroup className="h-12 rounded-full bg-card has-disabled:bg-card has-disabled:opacity-100 dark:has-disabled:bg-input/30">
              <InputGroupInput
                id="q"
                name="q"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={MAX_QUERY_LENGTH}
                autoComplete="off"
                placeholder="Ask a yes/no, pick-one or rating question…"
                className="pl-4 text-base"
              />
              <InputGroupAddon align="inline-end" className="pr-1.5">
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={!ready || pending}
                  className="rounded-full px-4"
                >
                  {pending ? "Reading…" : "Ask"}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </form>

      <section aria-label="Examples" className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          No text to hand? Try these on an example set of gym membership terms:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TEXT_QUESTIONS.map((q) => (
            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillExample(q)}
              className="h-auto min-h-8 max-w-full shrink rounded-full py-1.5 text-left whitespace-normal"
            >
              {q}
            </Button>
          ))}
        </div>
      </section>

      <div aria-live="polite">
        {pending ? (
          <Card role="status" aria-label="Reading your text…">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-48" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-2/3" />
            </CardContent>
          </Card>
        ) : state.status === "answered" ? (
          <ViewTransition key={state.id} enter="reveal-in" default="none">
            <div>
              <Answer outcome={state.outcome} mode="text" />
            </div>
          </ViewTransition>
        ) : state.status === "limit" ? (
          <ExtrasLimit limit={state.limit} pro={state.pro} />
        ) : state.status === "error" ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>No answer this time</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
