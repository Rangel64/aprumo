import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { brasiliaDateString } from "@/domain/flashcard-scheduler";
import { getJourneyCatalog } from "@/features/journey/catalog";
import { resolvePreselect } from "@/features/journey/journey-model";
import { NewJourneyForm } from "@/features/journey/NewJourneyForm";
import { createClient } from "@/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  // Slugs da URL viram ids aqui, no servidor; slug inválido ou desconhecido é ignorado.
  const catalog = await getJourneyCatalog();
  const preselect = resolvePreselect(catalog, query);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={ROUTES.journey}
          className="w-fit text-sm text-purple-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
        >
          Voltar à Jornada
        </Link>
        <h1 className="font-display text-3xl font-bold text-ink">Criar Jornada</h1>
        <p className="text-muted">Defina o que estudar, a meta e o prazo.</p>
      </header>
      {catalog.contents.length === 0 ? (
        <Card>
          <p role="status" className="text-ink">
            Ainda não há conteúdos disponíveis para montar uma Jornada.
          </p>
        </Card>
      ) : (
        <NewJourneyForm catalog={catalog} preselect={preselect} today={brasiliaDateString(new Date())} />
      )}
    </div>
  );
}
