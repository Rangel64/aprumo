"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { saveAvailability } from "@/server/actions/schedule";
import {
  MINUTES_MAX,
  MINUTES_MIN,
  WEEKDAY_LABELS,
  buildSaveInput,
  emptyDraft,
  validateSlots,
  type SlotDraft,
} from "./schedule-model";

const FIELD =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";
const DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
const GENERIC_ERROR = "Não foi possível salvar sua disponibilidade agora. Tente de novo.";

/**
 * Formulário de disponibilidade (US-016). Salvar SUBSTITUI a disponibilidade inteira (a visão do
 * cronograma não traz os horários atuais, então o formulário começa com uma linha vazia).
 * Erros por campo ficam em regiões vivas ligadas por aria-describedby e só aparecem depois da
 * primeira tentativa de salvar (o botão nunca fica desabilitado, para o erro ser alcançável).
 */
export function AvailabilityForm({
  required,
  onSaved,
  onCancel,
}: {
  /** Sem disponibilidade ainda: não há para onde voltar, então não mostra "Cancelar". */
  required: boolean;
  onSaved: (count: number) => void;
  onCancel: () => void;
}) {
  const nextId = useRef(1);
  const newId = () => `slot-${nextId.current++}`;
  const [rows, setRows] = useState<SlotDraft[]>(() => [emptyDraft("slot-0")]);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false); // trava de duplo clique no mesmo tick
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const validation = validateSlots(rows);

  const update = (id: string, patch: Partial<SlotDraft>) =>
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setSubmitted(true);
    setServerError(null);
    if (!validation.valid) return;
    busy.current = true;
    setPending(true);
    try {
      const res = await saveAvailability(buildSaveInput(rows));
      if (res.ok) {
        onSaved(res.data.count);
        return;
      }
      // A mensagem da action já vem em pt-BR e sem detalhes internos.
      setServerError(res.error.message);
    } catch {
      setServerError(GENERIC_ERROR);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-display text-xl font-bold text-ink focus:outline-none"
        >
          Disponibilidade
        </h2>
        <p className="text-sm text-muted">
          {required
            ? "Informe os dias e horários em que você pode estudar para gerar o cronograma. "
            : "Salvar substitui a disponibilidade atual. "}
          Cada horário vira uma sessão de estudo, com duração de {MINUTES_MIN} a {MINUTES_MAX} minutos.
          Horários em Brasília.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const err = validation.rows[r.id];
            const show = submitted;
            const n = i + 1;
            return (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-md border border-line p-3"
                aria-label={`Horário ${n}`}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
                  <div className="flex min-w-0 flex-col gap-1">
                    <label htmlFor={`${r.id}-weekday`} className="text-sm font-bold text-muted">
                      Dia da semana
                    </label>
                    <select
                      id={`${r.id}-weekday`}
                      value={r.weekday}
                      onChange={(e) => update(r.id, { weekday: Number(e.target.value) })}
                      className={FIELD}
                    >
                      {WEEKDAY_LABELS.map((label, w) => (
                        <option key={w} value={w}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <label htmlFor={`${r.id}-time`} className="text-sm font-bold text-muted">
                      Horário
                    </label>
                    <input
                      id={`${r.id}-time`}
                      type="time"
                      value={r.startTime}
                      onChange={(e) => update(r.id, { startTime: e.target.value })}
                      aria-required="true"
                      aria-invalid={show && err?.startTime ? true : undefined}
                      aria-describedby={`${r.id}-time-msg`}
                      className={FIELD}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <label htmlFor={`${r.id}-minutes`} className="text-sm font-bold text-muted">
                      Duração (min)
                    </label>
                    <input
                      id={`${r.id}-minutes`}
                      type="number"
                      inputMode="numeric"
                      min={MINUTES_MIN}
                      max={MINUTES_MAX}
                      value={r.minutes}
                      onChange={(e) => update(r.id, { minutes: e.target.value })}
                      aria-required="true"
                      aria-invalid={show && err?.minutes ? true : undefined}
                      aria-describedby={`${r.id}-minutes-msg`}
                      className={FIELD}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remover horário ${n}`}
                    onClick={() => setRows((cur) => cur.filter((x) => x.id !== r.id))}
                  >
                    Remover
                  </Button>
                </div>
                <p
                  id={`${r.id}-time-msg`}
                  role="status"
                  aria-live="polite"
                  className="min-h-5 text-sm font-bold text-ink"
                >
                  {show ? (err?.startTime ?? "") : ""}
                </p>
                <p
                  id={`${r.id}-minutes-msg`}
                  role="status"
                  aria-live="polite"
                  className="min-h-5 text-sm font-bold text-ink"
                >
                  {show ? (err?.minutes ?? "") : ""}
                </p>
              </li>
            );
          })}
        </ul>

        <p role="status" aria-live="polite" className="min-h-5 text-sm font-bold text-ink">
          {submitted ? (validation.general ?? "") : ""}
        </p>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRows((cur) => [...cur, emptyDraft(newId())])}
          >
            Adicionar horário
          </Button>
        </div>

        {serverError && (
          <p role="alert" className="rounded-md bg-coral-light px-4 py-3 font-bold text-ink">
            {serverError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" aria-disabled={pending} className={DISABLED}>
            {pending ? "Salvando..." : "Salvar disponibilidade"}
          </Button>
          {!required && (
            <Button variant="ghost" aria-disabled={pending} className={DISABLED} onClick={() => !busy.current && onCancel()}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
