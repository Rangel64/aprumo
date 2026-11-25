import Link from "next/link";
import { Card, Chip } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import type { StudyContentView } from "@/server/queries/content";
import { Markdown } from "./Markdown";
import { MarkStudying } from "./MarkStudying";
import { QuickQuestionBox } from "./QuickQuestionBox";
import { safeHttpUrl } from "./safe-url";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

/** Página de estudo (US-012). Recebe os dados prontos: serve a fixture e a leitura real. */
export function ContentPage({ data: view, track = true }: { data: StudyContentView; track?: boolean }) {
  const { summary, prerequisites, trail } = view;
  const sectionId = (n: number) => `secao-${n}`;

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-8">
      {track && <MarkStudying contentId={view.id} />}

      <header className="flex flex-col gap-3">
        <nav aria-label="Você está em">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <li>
              <Link href={ROUTES.map()} className={`text-purple-text underline ${focus}`}>
                Mapa
              </Link>
            </li>
            {trail && (
              <li className="flex items-center gap-2">
                <span aria-hidden="true">›</span>
                <Link href={ROUTES.trail(trail.slug)} className={`text-purple-text underline ${focus}`}>
                  {trail.name}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-2">
              <span aria-hidden="true">›</span>
              <span aria-current="page">{view.title}</span>
            </li>
          </ol>
        </nav>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">{view.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{summary}</p>
        {prerequisites.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Pré-requisitos</span>
            <ul className="flex flex-wrap gap-2">
              {prerequisites.map((p) => (
                <li key={p.slug}>
                  <Link href={ROUTES.content(p.slug)} className={`rounded-pill ${focus}`}>
                    <Chip tone="mint">{p.title}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Neste conteúdo" className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="font-display text-base font-bold text-ink">Neste conteúdo</h2>
          <ol className="mt-3 flex flex-col gap-1">
            {view.sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${sectionId(i + 1)}`}
                  className={`block rounded-md px-3 py-2 text-sm text-ink hover:bg-purple-light ${focus}`}
                >
                  <span className="text-muted">{i + 1}</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          {view.sections.map((s, i) => (
            <Card
              key={s.id}
              id={sectionId(i + 1)}
              className="scroll-mt-8"
              role="region"
              aria-labelledby={`${sectionId(i + 1)}-t`}
            >
              <p className="text-xs font-bold tracking-wide text-purple-text">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2
                id={`${sectionId(i + 1)}-t`}
                className="mt-1 mb-4 font-display text-2xl font-bold text-ink"
              >
                {s.title}
              </h2>
              <Markdown>{s.bodyMd}</Markdown>
              {s.quickQuestion && <QuickQuestionBox question={s.quickQuestion} />}
              <p className="mt-5 border-t border-line pt-3 text-sm text-muted">
                <span className="font-bold text-ink">Fonte: </span>
                {safeHttpUrl(s.sourceUrl) ? (
                  <a
                    href={safeHttpUrl(s.sourceUrl) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-purple-text underline ${focus}`}
                  >
                    {s.sourceCitation}
                  </a>
                ) : (
                  s.sourceCitation
                )}
              </p>
            </Card>
          ))}

          <Card className="flex flex-col items-start gap-3 bg-purple-light">
            <h2 className="font-display text-xl font-bold text-ink">Pronto para praticar?</h2>
            <p className="text-muted">
              O mini-simulado é uma sugestão para conferir o que você aprendeu e marcar este conteúdo
              como dominado.
            </p>
            <Link
              href={ROUTES.quiz(view.slug)}
              className={`inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`}
            >
              Ir para o mini-simulado
            </Link>
          </Card>
        </div>
      </div>
    </article>
  );
}
