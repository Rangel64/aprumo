import Link from "next/link";
import { Card } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import type { MapTrail } from "./map-model";

/** Cartão da Trilha do Mapa (como no protótipo): leva a `/trilhas/<slug>`. */
export function TrailCard({ trail }: { trail: MapTrail }) {
  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-wide text-purple-text">TRILHA</p>
        <p className="truncate font-display text-lg font-bold text-ink">{trail.name}</p>
        <p className="text-sm text-muted">
          {trail.contentCount} {trail.contentCount === 1 ? "conteúdo" : "conteúdos"}
        </p>
      </div>
      <Link
        href={ROUTES.trail(trail.slug)}
        aria-label={`Ver a Trilha ${trail.name}`}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-purple-dark font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
      >
        <span aria-hidden="true">→</span>
      </Link>
    </Card>
  );
}
