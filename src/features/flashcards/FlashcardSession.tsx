"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button, Card, Chip, ProgressBar } from "@/components/ui";
import type { FlashcardRating } from "@/contracts/actions";
import { ROUTES } from "@/contracts/routes";
import type { FlashcardView } from "@/contracts/views";
import { reviewFlashcard } from "@/server/actions/flashcards";
import {
  FLIP_ANNOUNCEMENT,
  RATINGS,
  REVIEW_ERROR,
  cardAnnouncement,
  doneCount,
  progressLabel,
  ratingLabel,
  reviewAnnouncement,
  shouldFlipOnSpace,
  todayInSaoPaulo,
} from "./flashcards-state";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";
const linkButton = `inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`;

/** Sessão de revisão (US-018). Só a aba "Pergunta e resposta" na hackathon. */
export function FlashcardSession({ cards }: { cards: FlashcardView[] }) {
  const total = cards.length;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [pending, startTransition] = useTransition();
  const questionRef = useRef<HTMLParagraphElement>(null);
  const answerRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const finished = index >= total;
  const card = finished ? null : cards[index];

  // Só usa setters e refs (estáveis): identidade fixa, serve ao botão e ao teclado.
  const flip = useCallback(() => {
    setFlipped(true);
    setError(null);
    setAnnounce(FLIP_ANNOUNCEMENT);
    // O botão "Ver resposta" desmonta: leva o foco à resposta.
    requestAnimationFrame(() => answerRef.current?.focus());
  }, []);

  // Espaço vira a carta; nunca com o foco em campo de texto ou botão (eles tratam o Espaço).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (!shouldFlipOnSpace(e.key, target, flipped, pending || finished)) return;
      e.preventDefault();
      flip();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flipped, pending, finished, flip]);

  useEffect(() => {
    if (finished) doneRef.current?.focus();
  }, [finished]);

  function rate(rating: FlashcardRating) {
    if (!card) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await reviewFlashcard({ flashcardId: card.id, rating });
        if (!res.ok) {
          setError(res.error.message || REVIEW_ERROR);
          return;
        }
        const next = index + 1;
        const result = reviewAnnouncement(
          ratingLabel(rating),
          res.data.nextDueOn,
          todayInSaoPaulo(new Date()),
        );
        setAnnounce(
          next < total ? `${result} ${cardAnnouncement(next, total)}` : `${result} Sessão concluída.`,
        );
        setIndex(next);
        setFlipped(false);
        setAttempt("");
        requestAnimationFrame(() => questionRef.current?.focus());
      } catch {
        setError(REVIEW_ERROR);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex flex-col items-center gap-2">
        <ProgressBar
          label="Progresso da revisão"
          value={doneCount(index, total)}
          max={total}
          className="max-w-xs"
        />
        <p className="text-xs text-muted">
          {finished
            ? `${total} de ${total} ${total === 1 ? "carta" : "cartas"}`
            : progressLabel(index, total)}
        </p>
        <p className="rounded-pill bg-purple-light px-4 py-1.5 text-sm font-bold text-purple-text">
          Pergunta e resposta
        </p>
      </header>

      {/* Região viva sempre no DOM: estado da carta e resultado da avaliação. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </div>

      {finished || !card ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <h1
            ref={doneRef}
            tabIndex={-1}
            className="font-display text-2xl font-bold text-ink outline-none"
          >
            Sessão concluída
          </h1>
          <p className="text-muted">
            Você revisou {total} {total === 1 ? "carta" : "cartas"}. Os conteúdos revisados aparecem
            como &quot;revisado hoje&quot; no Mapa.
          </p>
          <Link href={ROUTES.map()} className={linkButton}>
            Ver no Mapa
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-col gap-5 overflow-hidden p-5 sm:p-8">
          <h1 className="sr-only">Revisar cartões</h1>
          <Chip tone="purple" className="w-fit max-w-full uppercase">
            {card.contentTitle}
          </Chip>
          <p
            ref={questionRef}
            tabIndex={-1}
            className="min-h-24 break-words text-center font-display text-xl font-bold text-ink outline-none sm:text-2xl"
          >
            {card.front}
          </p>

          {flipped ? (
            <>
              <div className="rounded-md bg-purple-light p-4 text-center">
                <p className="text-xs font-bold tracking-wide text-purple-text">RESPOSTA</p>
                <p ref={answerRef} tabIndex={-1} className="mt-1 break-words text-ink outline-none">
                  {card.back}
                </p>
                {attempt.trim() !== "" && (
                  <p className="mt-3 break-words text-sm text-muted">Sua tentativa: {attempt}</p>
                )}
              </div>
              <div role="group" aria-label="Quanto você lembrava?" className="flex flex-col gap-2">
                <p className="text-center text-sm font-bold text-ink">Quanto você lembrava?</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RATINGS.map((r) => (
                    <Button
                      key={r.value}
                      variant={r.value === 4 ? "primary" : "secondary"}
                      disabled={pending}
                      onClick={() => rate(r.value)}
                      className="flex-col gap-0 px-3 py-2"
                    >
                      <span>{r.label}</span>
                      <span className="text-xs font-normal opacity-80">{r.hint}</span>
                    </Button>
                  ))}
                </div>
                {pending && <p className="text-center text-sm text-muted">Registrando...</p>}
                {error && (
                  <p role="alert" className="text-center text-sm font-bold text-ink">
                    {error}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="fc-attempt" className="text-xs text-muted">
                  Tente responder <span className="opacity-70">(opcional)</span>
                </label>
                <input
                  id="fc-attempt"
                  type="text"
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  placeholder="Digite seu palpite..."
                  autoComplete="off"
                  maxLength={500}
                  className={`w-full rounded-md border border-line bg-white px-3 py-3 text-ink placeholder:text-muted ${focus}`}
                />
              </div>
              <Button size="lg" onClick={flip} className="w-full">
                Ver resposta <span aria-hidden="true">→</span>
              </Button>
              <p className="text-center text-xs text-muted">
                <kbd className="rounded border border-line px-1.5 py-0.5">Espaço</kbd> virar a carta
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
