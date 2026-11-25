"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Card } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import type { QuizResult, QuizView } from "@/contracts/views";
import { submitQuizAttempt } from "@/server/actions/quiz";
import {
  buildPayload,
  firstUnansweredIndex,
  missingMessage,
  resultAnnouncement,
  reviewLinks,
  selectOption,
  unansweredCount,
  type Selected,
} from "./quiz-state";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";
const linkButton = `inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`;

type Props = {
  quiz: QuizView;
  slug: string;
  contentTitle: string;
  /** Ids das seções do conteúdo, em ordem (para as âncoras `#secao-N`). */
  sectionIds: string[];
};

/** Mini-simulado (US-013). O cliente só guarda as respostas escolhidas; a correção é do servidor. */
export function QuizForm({ quiz, slug, contentTitle, sectionIds }: Props) {
  const [selected, setSelected] = useState<Selected>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const contentHref = ROUTES.content(slug);
  const total = quiz.questions.length;
  const left = unansweredCount(quiz, selected);

  // O formulário desmonta quando o resultado chega: leva o foco ao título do resultado.
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = buildPayload(quiz, selected);
    if (!payload) {
      setMissing(missingMessage(left));
      // Foco na primeira questão sem resposta (primeira alternativa dela).
      const i = firstUnansweredIndex(quiz, selected);
      document.getElementById(`q${i}-o0`)?.focus();
      return;
    }
    setMissing(null);
    startTransition(async () => {
      try {
        const res = await submitQuizAttempt(payload);
        if (res.ok) setResult(res.data);
        else setError(res.error.message);
      } catch {
        setError("Não foi possível enviar suas respostas agora. Tente de novo.");
      }
    });
  }

  function retry() {
    setSelected({});
    setResult(null);
    setError(null);
    setMissing(null);
    topRef.current?.focus();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href={contentHref} className={`w-fit text-sm text-purple-text underline ${focus}`}>
          Voltar ao conteúdo
        </Link>
        <p className="text-xs font-bold tracking-wide text-purple-text">MINI-SIMULADO</p>
        <h1 ref={topRef} tabIndex={-1} className="font-display text-3xl font-bold text-ink outline-none">
          {contentTitle}
        </h1>
        <p className="text-muted">
          {total} questões para conferir o que você aprendeu. Responda todas e envie.
        </p>
      </header>

      {/* Região viva sempre no DOM, só com UMA frase curta; o cartão de resultado fica fora dela. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {result ? (
          <p className="sr-only">{resultAnnouncement(result)}</p>
        ) : error ? (
          <p className="font-bold text-ink">{error}</p>
        ) : missing ? (
          <p className="font-bold text-ink">{missing}</p>
        ) : pending ? (
          <p className="text-muted">Corrigindo suas respostas...</p>
        ) : null}
      </div>
      {result && (
        <ResultBox result={result} slug={slug} sectionIds={sectionIds} onRetry={retry} headingRef={resultRef} />
      )}

      {!result && (
        <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
          {quiz.questions.map((q, i) => (
            <Card key={q.id}>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 font-display text-lg font-bold text-ink">
                  <span className="text-purple-text">{i + 1}. </span>
                  {q.stem}
                </legend>
                {q.options.map((opt, j) => {
                  const id = `q${i}-o${j}`;
                  return (
                    <label
                      key={id}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-line px-4 py-3 text-ink hover:bg-purple-light has-[:checked]:border-purple has-[:checked]:bg-purple-light has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-purple-dark"
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`q-${q.id}`}
                        value={j}
                        checked={selected[q.id] === j}
                        onChange={() => {
                          setMissing(null);
                          setSelected((s) => selectOption(s, q.id, j));
                        }}
                        className="mt-1 size-4 accent-purple"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </fieldset>
            </Card>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar respostas"}
            </Button>
            <span className="text-sm text-muted">
              {total - left} de {total} respondidas
            </span>
          </div>
        </form>
      )}
    </div>
  );
}

function ResultBox({
  result,
  slug,
  sectionIds,
  onRetry,
  headingRef,
}: {
  result: QuizResult;
  slug: string;
  sectionIds: string[];
  onRetry: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const links = reviewLinks(result, sectionIds, ROUTES.content(slug));
  return (
    <Card className="flex flex-col items-start gap-3">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold text-ink outline-none">
        {result.passed ? "Conteúdo dominado" : "Ainda não foi desta vez"}
      </h2>
      <p className="text-ink">
        Você acertou {result.correct} de {result.total} (mínimo de {result.thresholdPct}% para dominar).
      </p>
      {result.passed ? (
        <>
          <p className="text-muted">Bom trabalho! Seu nó já aparece aceso no Mapa.</p>
          <Link href={ROUTES.map("dominado")} className={linkButton}>
            Ver no Mapa
          </Link>
        </>
      ) : (
        <>
          {links.length > 0 && (
            <>
              <p className="text-muted">Vale rever estas seções antes de tentar de novo:</p>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {links.map((l) => (
                  <li key={l.id}>
                    <Link href={l.href} className={`text-purple-text underline ${focus}`}>
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href={ROUTES.content(slug)} className={linkButton}>
              Voltar ao estudo
            </Link>
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
