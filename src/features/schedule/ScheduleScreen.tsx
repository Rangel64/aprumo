"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Chip, ProgressBar } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import type { ScheduleView } from "@/contracts/views";
import { generateSchedule } from "@/server/actions/schedule";
import { AvailabilityForm } from "./AvailabilityForm";
import {
  WEEKDAY_SHORT,
  dayProgress,
  formatDayHeading,
  formatDayMonth,
  formatMinutes,
  generationMessage,
  groupWeek,
  needsAvailability,
  progressLabel,
  weekdayOf,
  type ScheduleItem,
} from "./schedule-model";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";
const DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
const primaryLink = `inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`;
const smallLink = `inline-flex shrink-0 items-center justify-center rounded-pill bg-purple px-4 py-2 text-sm font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`;

const AVAILABILITY_BUTTON_ID = "schedule-availability-button";
const REGENERATE_ERROR = "Não foi possível regerar o cronograma agora. Tente de novo.";

/** Convite quando não há Jornada ativa. */
export function ScheduleNoJourney() {
  return (
    <Card className="flex flex-col items-start gap-3">
      <h2 className="font-display text-xl font-bold text-ink">Você ainda não tem uma Jornada</h2>
      <p role="status" className="text-muted">
        O cronograma distribui os conteúdos da sua Jornada nos seus horários livres. Crie uma Jornada
        para começar.
      </p>
      <Link href={ROUTES.newJourney()} className={primaryLink}>
        Criar Jornada
      </Link>
    </Card>
  );
}

function SessionRow({ item, canStart }: { item: ScheduleItem; canStart: boolean }) {
  const done = item.status === "done";
  return (
    <li className="flex gap-3 sm:gap-4">
      <span className="w-12 shrink-0 pt-4 text-sm font-bold text-muted">{item.time}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 rounded-md border border-line bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Estudar conteúdo</p>
          <p className="break-words font-bold text-ink">{item.contentTitle}</p>
          <p className="text-sm text-muted">{formatMinutes(item.minutes)}</p>
        </div>
        <Chip tone={done ? "mint" : "purple"}>{done ? "Feita" : "Planejada"}</Chip>
        {canStart && !done && (
          <Link
            href={ROUTES.content(item.contentSlug)}
            aria-label={`Começar sessão: ${item.contentTitle}`}
            className={smallLink}
          >
            Começar sessão
          </Link>
        )}
      </div>
    </li>
  );
}

/**
 * Tela do Cronograma (US-016). `today` (YYYY-MM-DD, Brasília) vem do servidor para o HTML do
 * servidor e o do cliente concordarem. Sem cota nem cobrança (RN-009).
 */
export function ScheduleScreen({ view, today }: { view: ScheduleView; today: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"today" | "week">("today");
  const [formOpen, setFormOpen] = useState(false);
  // Sem disponibilidade o formulário é a tela (derivado da visão, vale também após router.refresh).
  const mode: "list" | "form" = formOpen || !view.hasAvailability ? "form" : "list";
  const [message, setMessage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const busy = useRef(false); // trava de duplo clique no mesmo tick
  const returnFocus = useRef(false);

  // Depois de fechar o formulário, devolve o foco ao botão que o abriu.
  useEffect(() => {
    if (mode === "list" && returnFocus.current) {
      returnFocus.current = false;
      document.getElementById(AVAILABILITY_BUTTON_ID)?.focus();
    }
  }, [mode]);

  const week = groupWeek(view.sessions, today);
  const todayItems = week[0].sessions;
  const progress = dayProgress(todayItems);
  const hasAny = view.sessions.length > 0;

  async function regenerate() {
    if (busy.current || !view.journeyId) return;
    busy.current = true;
    setGenerating(true);
    setGenError(null);
    setMessage(null);
    try {
      const res = await generateSchedule({ journeyId: view.journeyId });
      if (res.ok) {
        setMessage(generationMessage(res.data));
        router.refresh();
      } else if (needsAvailability(res.error)) {
        setMessage("Informe sua disponibilidade para gerar o cronograma.");
        setFormOpen(true);
      } else {
        // Alerta genérico: sem detalhes internos, e a tela atual continua.
        setGenError(REGENERATE_ERROR);
      }
    } catch {
      setGenError(REGENERATE_ERROR);
    } finally {
      busy.current = false;
      setGenerating(false);
    }
  }

  function onSaved(count: number) {
    returnFocus.current = true;
    setGenError(null);
    setMessage(
      `Disponibilidade salva (${count} ${count === 1 ? "horário" : "horários"}). Use "Regerar cronograma" para atualizar as sessões.`,
    );
    setFormOpen(false);
    router.refresh();
  }

  function closeForm() {
    returnFocus.current = true;
    setFormOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Período" className="flex gap-1 rounded-pill bg-purple-light p-1">
          {(
            [
              ["today", "Hoje"],
              ["week", "Semana"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={tab === key ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            id={AVAILABILITY_BUTTON_ID}
            variant="secondary"
            size="sm"
            aria-expanded={mode === "form"}
            onClick={() => setFormOpen(true)}
          >
            Disponibilidade
          </Button>
          <Button
            size="sm"
            aria-disabled={generating}
            className={DISABLED}
            onClick={regenerate}
          >
            {generating ? "Gerando..." : "Regerar cronograma"}
          </Button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="empty:hidden font-bold text-ink">
        {message}
      </p>
      {genError && (
        <p role="alert" className="rounded-md bg-coral-light px-4 py-3 font-bold text-ink">
          {genError}
        </p>
      )}
      {view.deadlineAtRisk && (
        <div className="rounded-md bg-yellow-light px-4 py-3 text-ink">
          <p className="font-bold">Prazo em risco</p>
          <p>
            Seu prazo está em risco: os horários disponíveis até o prazo não cobrem todos os conteúdos
            pendentes. Você pode ampliar a disponibilidade ou ajustar o prazo; o cronograma continua sendo
            gerado com os horários que você informou.
          </p>
        </div>
      )}

      {mode === "form" ? (
        <AvailabilityForm required={!view.hasAvailability} onSaved={onSaved} onCancel={closeForm} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card className="flex min-w-0 flex-col gap-4">
            {tab === "today" ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-muted">
                      {formatDayHeading(today).split(",")[0]}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-ink">{formatDayMonth(today)}</h2>
                  </div>
                  {progress.total > 0 && (
                    <div className="flex w-40 flex-col gap-1">
                      <p className="text-right text-xs text-muted">{progressLabel(progress)}</p>
                      <ProgressBar value={progress.done} max={progress.total} label="Sessões feitas hoje" />
                    </div>
                  )}
                </div>
                {todayItems.length === 0 ? (
                  <p className="text-muted">
                    {hasAny
                      ? "Nenhuma sessão para hoje. Veja a aba Semana para os próximos dias."
                      : "Nenhuma sessão por aqui ainda. Use \"Regerar cronograma\" para distribuir os conteúdos da sua Jornada nos seus horários."}
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {todayItems.map((s) => (
                      <SessionRow key={s.id} item={s} canStart />
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <>
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">Próximos 7 dias</h2>
                  <p className="text-xs text-muted">Mostrando os próximos 7 dias.</p>
                </div>
                {!hasAny && (
                  <p className="text-muted">
                    Nenhuma sessão por aqui ainda. Use &quot;Regerar cronograma&quot; para distribuir os
                    conteúdos da sua Jornada nos seus horários.
                  </p>
                )}
                {week.map((day) => (
                  <section key={day.date} aria-labelledby={`day-${day.date}`} className="flex flex-col gap-2">
                    <h3 id={`day-${day.date}`} className="font-bold text-ink">
                      {formatDayHeading(day.date)}
                      {day.date === today && <span className="font-normal text-muted"> (hoje)</span>}
                    </h3>
                    {day.sessions.length === 0 ? (
                      <p className="text-sm text-muted">Sem sessões neste dia.</p>
                    ) : (
                      <ol className="flex flex-col gap-3">
                        {day.sessions.map((s) => (
                          <SessionRow key={s.id} item={s} canStart={day.date === today} />
                        ))}
                      </ol>
                    )}
                  </section>
                ))}
              </>
            )}
          </Card>

          <Card className="flex h-fit flex-col gap-3">
            <h2 className="font-display text-lg font-bold text-ink">Sua semana</h2>
            <ol className="grid grid-cols-7 gap-1 text-center">
              {week.map((day) => {
                const total = day.sessions.length;
                return (
                  <li
                    key={day.date}
                    aria-label={`${formatDayHeading(day.date)}: ${total === 0 ? "sem sessões" : progressLabel(dayProgress(day.sessions))}`}
                    className="flex min-w-0 flex-col items-center gap-1"
                  >
                    <span className="text-xs text-muted">{WEEKDAY_SHORT[weekdayOf(day.date)]}</span>
                    <span
                      aria-hidden="true"
                      className={`flex size-8 items-center justify-center rounded-full border text-sm font-bold text-ink ${
                        day.date === today ? "border-purple bg-purple-light" : "border-line"
                      }`}
                    >
                      {total}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="text-xs text-muted">Número de sessões por dia.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
