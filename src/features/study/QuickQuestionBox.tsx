"use client";

import { useId, useState } from "react";
import { Button, cn } from "@/components/ui";
import type { QuickQuestion } from "@/contracts/views";
import { checkQuickQuestion, optionLetter, type QuickQuestionResult } from "./quick-question";

/** Pergunta rápida (autoavaliação). O resultado é anunciado em `role="status"` (aria-live polite). */
export function QuickQuestionBox({ question }: { question: QuickQuestion }) {
  const name = useId();
  const [chosen, setChosen] = useState<number | null>(null);
  const [state, setState] = useState<QuickQuestionResult>({ state: "unanswered", message: "" });
  const [checked, setChecked] = useState(false);

  const message = checked ? state.message : "";

  return (
    <fieldset className="mt-4 rounded-md bg-purple-light p-5">
      <legend className="px-1 text-xs font-bold tracking-wide text-purple-text uppercase">
        Pausa rápida
      </legend>
      <p className="font-bold text-ink">{question.prompt}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isCorrect = checked && state.state !== "unanswered" && i === question.correctIndex;
          const isWrong = checked && state.state === "incorrect" && i === chosen;
          return (
            <li key={i}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border border-line bg-white px-4 py-3 text-ink",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-purple-dark",
                  isCorrect && "border-mint bg-mint-light",
                  isWrong && "border-coral bg-coral-light",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={i}
                  checked={chosen === i}
                  onChange={() => {
                    setChosen(i);
                    setChecked(false);
                  }}
                  className="mt-1 accent-purple"
                />
                <span>
                  <span className="font-bold">{optionLetter(i)}.</span> {option}
                  {isCorrect && <span className="sr-only"> (correta)</span>}
                  {isWrong && <span className="sr-only"> (incorreta)</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => {
            setState(checkQuickQuestion(question, chosen));
            setChecked(true);
          }}
        >
          Conferir
        </Button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-ink">
        {message}
      </p>
    </fieldset>
  );
}
