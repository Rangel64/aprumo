import Link from "next/link";
import { ROUTES, MAP_STATE_FILTERS, type MapStateFilter } from "@/contracts/routes";
import { FILTER_LABELS } from "./map-model";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

/** Filtro por estado: links (a URL é a fonte da verdade, `?estado=`). "Bloqueado" não existe no contrato. */
export function MapFilters({ current }: { current: MapStateFilter }) {
  return (
    <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {MAP_STATE_FILTERS.map((f) => {
        const active = f === current;
        return (
          <Link
            key={f}
            href={ROUTES.map(f)}
            aria-current={active ? "true" : undefined}
            className={`rounded-pill px-4 py-2 text-sm font-bold ${focus} ${
              active
                ? "bg-purple-dark text-white"
                : "border border-line bg-white text-ink hover:bg-purple-light"
            }`}
          >
            {FILTER_LABELS[f]}
          </Link>
        );
      })}
    </nav>
  );
}
