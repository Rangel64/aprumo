import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Chip } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { createClient } from "@/lib/supabase/server";
import { getTrail } from "@/server/queries/trail";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const trail = await getTrail(slug);
  const total = trail.contents.length;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <nav aria-label="Você está em">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <li>
              <Link href={ROUTES.map()} className={`text-purple-text underline ${focus}`}>
                Mapa
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">›</span>
              <span aria-current="page">{trail.name}</span>
            </li>
          </ol>
        </nav>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">{trail.name}</h1>
        <p className="text-lg text-muted">{trail.objective}</p>
        <div className="flex flex-wrap gap-2">
          <Chip tone="purple">Origem: plataforma</Chip>
          <Chip tone="mint">
            {total} {total === 1 ? "conteúdo" : "conteúdos"}
          </Chip>
        </div>
        <div>
          <Link
            href={ROUTES.newJourney({ trilha: trail.slug })}
            className={`inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`}
          >
            Criar Jornada com esta Trilha
          </Link>
        </div>
      </header>

      <Card>
        <h2 className="font-display text-xl font-bold text-ink">Conteúdos da Trilha</h2>
        {total === 0 ? (
          <p className="mt-3 text-muted">Esta Trilha ainda não tem conteúdos.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-1">
            {trail.contents.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={ROUTES.content(c.slug)}
                  className={`flex gap-3 rounded-md px-3 py-2 text-ink hover:bg-purple-light ${focus}`}
                >
                  <span className="text-muted">{i + 1}</span>
                  {c.title}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </article>
  );
}
