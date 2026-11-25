"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { Chip } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { STATUS_LABELS, type NodeDetails } from "./map-model";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

const FOCUSABLE = "a[href], button:not([disabled])";

const statusTone = { not_started: "neutral", studying: "yellow", mastered: "mint" } as const;

/**
 * Drawer do nó (diálogo modal): o foco entra ao abrir, Tab circula dentro dele, Esc fecha e
 * quem chama devolve o foco ao nó (`onClose`). Os links levam a rotas de outras telas.
 */
export function NodeDrawer({
  details,
  onClose,
}: {
  details: NodeDetails;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { node, prerequisites, trails } = details;

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-white p-6 shadow-card outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-2xl font-bold text-ink">
            {node.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do conteúdo"
            className={`shrink-0 rounded-pill px-3 py-1 text-lg font-bold text-ink hover:bg-purple-light ${focus}`}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <section aria-labelledby={`${titleId}-estado`} className="flex flex-col gap-2">
          <h3 id={`${titleId}-estado`} className="text-sm font-bold text-muted">
            Estado
          </h3>
          <div className="flex flex-wrap gap-2">
            <Chip tone={statusTone[node.status]}>{STATUS_LABELS[node.status]}</Chip>
            {node.reviewedToday && <Chip tone="purple">Revisado hoje</Chip>}
          </div>
        </section>

        <section aria-labelledby={`${titleId}-pre`} className="flex flex-col gap-2">
          <h3 id={`${titleId}-pre`} className="text-sm font-bold text-muted">
            Pré-requisitos
          </h3>
          {prerequisites.length === 0 ? (
            <p className="text-ink">Nenhum: você pode começar por aqui.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {prerequisites.map((p) => (
                <li key={p.slug}>
                  <Link href={ROUTES.content(p.slug)} className={`rounded-pill ${focus}`}>
                    <Chip tone="mint">{p.title}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby={`${titleId}-trilhas`} className="flex flex-col gap-2">
          <h3 id={`${titleId}-trilhas`} className="text-sm font-bold text-muted">
            Trilhas
          </h3>
          {trails.length === 0 ? (
            <p className="text-ink">Este conteúdo não está em nenhuma Trilha.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {trails.map((t) => (
                <li key={t.id}>
                  <Link href={ROUTES.trail(t.slug)} className={`rounded-pill ${focus}`}>
                    <Chip tone="purple">{t.name}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {node.competencies.length > 0 && (
          <section aria-labelledby={`${titleId}-comp`} className="flex flex-col gap-2">
            <h3 id={`${titleId}-comp`} className="text-sm font-bold text-muted">
              Competências do ENEM
            </h3>
            <ul className="flex flex-wrap gap-2">
              {node.competencies.map((c) => (
                <li key={c}>
                  <Chip tone="blue">Competência {c}</Chip>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <Link
            href={ROUTES.content(node.slug)}
            className={`inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`}
          >
            Estudar conteúdo
          </Link>
          <Link
            href={ROUTES.newJourney({ conteudos: [node.slug] })}
            className={`inline-flex items-center justify-center rounded-pill border border-line bg-white px-6 py-3 font-bold text-ink shadow-card hover:bg-purple-light ${focus}`}
          >
            Adicionar a uma Jornada
          </Link>
        </div>
      </div>
    </div>
  );
}
