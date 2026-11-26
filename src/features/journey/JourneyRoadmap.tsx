import Link from "next/link";
import { Card, Chip, ProgressBar } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import type { JourneyView } from "@/contracts/views";
import { STATUS_LABELS } from "@/features/map/map-model";
import { daysRemaining, formatDeadline, remainingLabel } from "./journey-model";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";
const primaryLink = `inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`;
const tone = {
  not_started: "neutral",
  studying: "yellow",
  mastered: "mint",
} as const;

/** Convite quando não há Jornada ativa. */
export function JourneyEmpty() {
  return (
    <Card className="flex flex-col items-start gap-3">
      <h2 className="font-display text-xl font-bold text-ink">Você ainda não tem uma Jornada</h2>
      <p role="status" className="text-muted">
        Crie uma Jornada com uma meta e um prazo para ver o caminho de estudo aqui.
      </p>
      <Link href={ROUTES.newJourney()} className={primaryLink}>
        Criar Jornada
      </Link>
    </Card>
  );
}

/** Roadmap da Jornada ativa (US-011): meta, prazo, progresso e conteúdos em ordem. */
export function JourneyRoadmap({ journey, today }: { journey: JourneyView; today: string }) {
  const days = remainingLabel(daysRemaining(journey.deadline, today));
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-muted">Meta</p>
          <h2 className="break-words font-display text-2xl font-bold text-ink">
            {journey.goalDescription}
          </h2>
        </div>
        <p className="text-ink">
          <span className="font-bold">Prazo: </span>
          {formatDeadline(journey.deadline)}
          {days && <span className="text-muted"> ({days})</span>}
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-ink">
            <span className="font-bold">{journey.masteredCount}</span> de{" "}
            <span className="font-bold">{journey.total}</span>{" "}
            {journey.total === 1 ? "conteúdo dominado" : "conteúdos dominados"}
          </p>
          <ProgressBar
            value={journey.masteredCount}
            max={journey.total}
            label="Progresso da Jornada"
          />
        </div>
        {journey.nextContentSlug && (
          <div>
            <Link href={ROUTES.content(journey.nextContentSlug)} className={primaryLink}>
              Estudar o próximo conteúdo
            </Link>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold text-ink">Roteiro</h2>
        {journey.contents.length === 0 ? (
          <p role="status" className="mt-3 text-muted">
            Esta Jornada ainda não tem conteúdos. Abra o Mapa para escolher os primeiros.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {journey.contents.map((c, i) => {
              const isNext = c.slug === journey.nextContentSlug;
              return (
                <li
                  key={c.id}
                  aria-current={isNext ? "step" : undefined}
                  className={`flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 ${
                    isNext ? "border-purple bg-purple-light" : "border-line"
                  }`}
                >
                  <span className="w-6 shrink-0 text-muted" aria-hidden="true">
                    {i + 1}
                  </span>
                  <Link
                    href={ROUTES.content(c.slug)}
                    className={`min-w-0 flex-1 break-words font-bold text-ink hover:underline ${focus}`}
                  >
                    {c.title}
                  </Link>
                  <Chip tone={tone[c.status]}>{STATUS_LABELS[c.status]}</Chip>
                  {isNext && (
                    <Link
                      href={ROUTES.content(c.slug)}
                      aria-label={`Estudar ${c.title}`}
                      className={`inline-flex items-center justify-center rounded-pill bg-purple px-4 py-2 text-sm font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`}
                    >
                      Estudar
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div>
        <Link href={ROUTES.map()} className={`text-purple-text underline ${focus}`}>
          Abrir Mapa
        </Link>
      </div>
    </div>
  );
}
