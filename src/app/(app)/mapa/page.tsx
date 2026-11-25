import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { MapCanvas } from "@/features/map/MapCanvas";
import { MapFilters } from "@/features/map/MapFilters";
import { FILTER_LABELS, filterNodes, parseStateFilter } from "@/features/map/map-model";
import { TrailCard } from "@/features/map/TrailCard";
import { createClient } from "@/lib/supabase/server";
import { getMapTrails, getMapView } from "@/server/queries/map";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  const { estado } = await searchParams;
  const filter = parseStateFilter(estado);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const [view, trails] = await Promise.all([getMapView(user.id), getMapTrails()]);
  const visibleCount = filterNodes(view.nodes, filter).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            Mapa de Conteúdos
          </h1>
          <p className="mt-2 text-muted">
            Explore as relações entre os conteúdos e encontre o seu próximo passo.
          </p>
        </div>
        <Link
          href={ROUTES.newJourney()}
          className={`inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark ${focus}`}
        >
          Criar Jornada
        </Link>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <MapFilters current={filter} />
        <p role="status" className="text-sm text-muted">
          {visibleCount} {visibleCount === 1 ? "conteúdo" : "conteúdos"}
          {filter === "todos" ? "" : ` (${FILTER_LABELS[filter]})`}
        </p>
      </div>

      {trails.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trails.map((t) => (
            <TrailCard key={t.id} trail={t} />
          ))}
        </div>
      )}

      {view.nodes.length === 0 ? (
        <Card>
          <p className="text-ink">O Mapa ainda não tem conteúdos. Volte em instantes.</p>
        </Card>
      ) : visibleCount === 0 ? (
        <Card className="flex flex-col items-start gap-3">
          <p className="text-ink">Nenhum conteúdo com este estado por enquanto.</p>
          <Link
            href={ROUTES.map()}
            className={`font-bold text-purple-text underline ${focus}`}
          >
            Limpar filtros
          </Link>
        </Card>
      ) : (
        <MapCanvas view={view} filter={filter} trails={trails} />
      )}
    </div>
  );
}
