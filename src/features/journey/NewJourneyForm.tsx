"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { createJourney } from "@/server/actions/journey";
import {
  GOAL_MAX,
  buildCreateInput,
  fieldFromActionError,
  minDeadlineAt,
  validateFormAt,
  type BaseType,
  type Catalog,
  type FormField,
  type Preselect,
} from "./journey-model";

const FIELD =
  "w-full rounded-md border border-line bg-white px-4 py-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";
const OPTION =
  "flex cursor-pointer items-start gap-3 rounded-md border border-line px-4 py-3 text-ink hover:bg-purple-light has-[:checked]:border-purple has-[:checked]:bg-purple-light has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-purple-dark";

const GENERIC_ERROR = "Não foi possível criar a Jornada agora. Tente de novo.";

/**
 * Formulário de Criar Jornada (US-011). "Hoje" (Brasília) é recalculado a cada render e no
 * submit, para a aba aberta à meia-noite não validar com o dia antigo. A prop `today` (do
 * servidor) ficou só por compatibilidade e não é mais usada.
 */
export function NewJourneyForm({
  catalog,
  preselect,
}: {
  catalog: Catalog;
  preselect: Preselect;
  today?: string;
}) {
  const router = useRouter();
  const [baseType, setBaseType] = useState<BaseType>(preselect.baseType);
  const [trailId, setTrailId] = useState<string | null>(preselect.trailId);
  const [contentIds, setContentIds] = useState<string[]>(preselect.contentIds);
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverField, setServerField] = useState<FormField | null>(null);
  const [pending, startTransition] = useTransition();

  const values = { baseType, trailId, contentIds, goal, deadline };
  const now = new Date();
  const errors = validateFormAt(values, now);
  const blocked = Object.keys(errors).length > 0;
  const hasTrails = catalog.trails.length > 0;

  const touch = (f: FormField) => setTouched((t) => ({ ...t, [f]: true }));
  const shown = (f: FormField) => (touched[f] ? (errors[f] ?? "") : "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || Object.keys(validateFormAt(values, new Date())).length > 0) return;
    setServerError(null);
    setServerField(null);
    startTransition(async () => {
      try {
        const res = await createJourney(buildCreateInput(values));
        if (res.ok) {
          router.push(ROUTES.journey);
          router.refresh();
          return;
        }
        // A mensagem da action já vem em pt-BR e sem detalhes internos.
        const field = fieldFromActionError(res.error.field);
        if (field) setTouched((t) => ({ ...t, [field]: true }));
        setServerField(field);
        setServerError(res.error.message);
      } catch {
        setServerError(GENERIC_ERROR);
      }
    });
  }

  function toggleContent(id: string) {
    setContentIds((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));
    touch("base");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <fieldset aria-describedby="base-msg" className="flex min-w-0 flex-col gap-3">
          <legend className="mb-3 font-display text-xl font-bold text-ink">
            Do que a Jornada é feita
          </legend>
          {hasTrails && (
            <label className={OPTION}>
              <input
                type="radio"
                name="base"
                value="trail"
                checked={baseType === "trail"}
                onChange={() => setBaseType("trail")}
                className="mt-1 size-4 accent-purple"
              />
              <span>Uma Trilha da plataforma</span>
            </label>
          )}
          {hasTrails && baseType === "trail" && (
            <div className="flex flex-col gap-2 pl-2">
              <label htmlFor="trail" className="text-sm font-bold text-muted">
                Trilha
              </label>
              <select
                id="trail"
                value={trailId ?? ""}
                onChange={(e) => setTrailId(e.target.value || null)}
                onBlur={() => touch("base")}
                className={FIELD}
              >
                {catalog.trails.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted">
                {catalog.trails.find((t) => t.id === trailId)?.objective}
              </p>
            </div>
          )}
          <label className={OPTION}>
            <input
              type="radio"
              name="base"
              value="contents"
              checked={baseType === "contents"}
              onChange={() => setBaseType("contents")}
              className="mt-1 size-4 accent-purple"
            />
            <span>Conteúdos que eu escolher</span>
          </label>
          {baseType === "contents" && (
            <ul className="flex flex-col gap-2 pl-2" aria-label="Conteúdos do catálogo">
              {catalog.contents.map((c) => (
                <li key={c.id}>
                  <label className={OPTION}>
                    <input
                      type="checkbox"
                      checked={contentIds.includes(c.id)}
                      onChange={() => toggleContent(c.id)}
                      className="mt-1 size-4 accent-purple"
                    />
                    <span>{c.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p
            id="base-msg"
            role="status"
            aria-live="polite"
            className="min-h-5 text-sm font-bold text-ink"
          >
            {shown("base") || (serverField === "base" ? (serverError ?? "") : "")}
          </p>
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="goal" className="font-display text-xl font-bold text-ink">
            Meta
          </label>
          <p id="goal-hint" className="text-sm text-muted">
            O que você quer alcançar? De 3 a 200 caracteres. Campo obrigatório.
          </p>
          <textarea
            id="goal"
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onBlur={() => touch("goal")}
            aria-required="true"
            aria-invalid={shown("goal") ? true : undefined}
            aria-describedby="goal-hint goal-msg"
            placeholder="Ex.: chegar ao ENEM escrevendo uma redação nota 800"
            className={FIELD}
          />
          <div className="flex items-start justify-between gap-3">
            <p
              id="goal-msg"
              role="status"
              aria-live="polite"
              className="min-h-5 text-sm font-bold text-ink"
            >
              {shown("goal")}
            </p>
            <span className="shrink-0 text-sm text-muted" aria-hidden="true">
              {goal.trim().length}/{GOAL_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="deadline" className="font-display text-xl font-bold text-ink">
            Prazo
          </label>
          <p id="deadline-hint" className="text-sm text-muted">
            Data para concluir, a partir de amanhã. Campo obrigatório.
          </p>
          <input
            id="deadline"
            type="date"
            min={minDeadlineAt(now)}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            onBlur={() => touch("deadline")}
            aria-required="true"
            aria-invalid={shown("deadline") ? true : undefined}
            aria-describedby="deadline-hint deadline-msg"
            className={`${FIELD} sm:max-w-xs`}
          />
          <p
            id="deadline-msg"
            role="status"
            aria-live="polite"
            className="min-h-5 text-sm font-bold text-ink"
          >
            {shown("deadline")}
          </p>
        </div>
      </Card>

      <Card>
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-3 font-display text-xl font-bold text-ink">Metodologia</legend>
          <label className={OPTION}>
            <input
              type="radio"
              name="methodology"
              value="none"
              checked
              readOnly
              className="mt-1 size-4 accent-purple"
            />
            <span>Prefiro sem metodologia</span>
          </label>
        </fieldset>
      </Card>

      {serverError && serverField !== "base" && (
        <p role="alert" className="rounded-md bg-coral-light px-4 py-3 font-bold text-ink">
          {serverError}
        </p>
      )}

      <div className="flex flex-col items-start gap-2">
        <Button type="submit" disabled={blocked || pending} aria-describedby="submit-hint">
          {pending ? "Criando..." : "Começar"}
        </Button>
        <p id="submit-hint" className="text-sm text-muted">
          {blocked
            ? "Preencha a meta e o prazo, e escolha o que estudar, para começar."
            : "Tudo certo para começar."}
        </p>
      </div>
    </form>
  );
}
