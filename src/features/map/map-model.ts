import { MAP_STATE_FILTERS, type MapStateFilter } from "@/contracts/routes";
import type { ContentStatus, MapNode, MapView } from "@/contracts/views";

/** Trilha como o Mapa a mostra (cartão e drawer). */
export type MapTrail = { id: string; slug: string; name: string; contentCount: number };

export const FILTER_LABELS: Record<MapStateFilter, string> = {
  todos: "Todos",
  "nao-iniciado": "Não iniciados",
  estudando: "Em estudo",
  dominado: "Dominados",
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  not_started: "Não iniciado",
  studying: "Em estudo",
  mastered: "Dominado",
};

const FILTER_STATUS: Record<Exclude<MapStateFilter, "todos">, ContentStatus> = {
  dominado: "mastered",
  estudando: "studying",
  "nao-iniciado": "not_started",
};

/** `?estado=`: valor ausente, repetido ou inválido vira "todos". */
export function parseStateFilter(raw: string | string[] | undefined): MapStateFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (MAP_STATE_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as MapStateFilter)
    : "todos";
}

export function filterNodes(nodes: MapNode[], filter: MapStateFilter): MapNode[] {
  if (filter === "todos") return nodes;
  const status = FILTER_STATUS[filter];
  return nodes.filter((n) => n.status === status);
}

export type FlowNodeData = {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  reviewedToday: boolean;
};
export type FlowNode = {
  id: string;
  type: "content";
  position: { x: number; y: number };
  data: FlowNodeData;
};
export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  className: "edge-prerequisite" | "edge-related";
  style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
};

/**
 * Nós e arestas do React Flow. As posições são as do seed (sem biblioteca de layout).
 * Só entram arestas cujas duas pontas estão visíveis. Cores vêm dos tokens do tema (CSS vars).
 */
export function buildFlowElements(
  view: MapView,
  filter: MapStateFilter,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const visible = filterNodes(view.nodes, filter);
  const ids = new Set(visible.map((n) => n.id));
  const nodes: FlowNode[] = visible.map((n) => ({
    id: n.id,
    type: "content",
    position: { x: n.position.x, y: n.position.y },
    data: {
      id: n.id,
      slug: n.slug,
      title: n.title,
      status: n.status,
      reviewedToday: n.reviewedToday,
    },
  }));
  const edges: FlowEdge[] = view.edges
    .filter((e) => ids.has(e.from) && ids.has(e.to))
    .map((e) =>
      e.kind === "prerequisite"
        ? {
            id: `${e.from}->${e.to}:prerequisite`,
            source: e.from,
            target: e.to,
            className: "edge-prerequisite",
            style: { stroke: "var(--color-purple)", strokeWidth: 2 },
          }
        : {
            id: `${e.from}->${e.to}:related`,
            source: e.from,
            target: e.to,
            className: "edge-related",
            style: {
              stroke: "var(--color-muted)",
              strokeWidth: 1.5,
              strokeDasharray: "6 4",
            },
          },
    );
  return { nodes, edges };
}

export type NodeDetails = {
  node: MapNode;
  prerequisites: { slug: string; title: string }[];
  trails: MapTrail[];
};

/** Dados do drawer. Pré-requisitos vêm do grafo completo, mesmo que o filtro os esconda. */
export function getNodeDetails(
  view: MapView,
  trails: MapTrail[],
  nodeId: string,
): NodeDetails | null {
  const node = view.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const byId = new Map(view.nodes.map((n) => [n.id, n]));
  const prerequisites = view.edges
    .filter((e) => e.kind === "prerequisite" && e.to === nodeId)
    .flatMap((e) => {
      const p = byId.get(e.from);
      return p ? [{ slug: p.slug, title: p.title }] : [];
    });
  return {
    node,
    prerequisites,
    trails: trails.filter((t) => node.trailIds.includes(t.id)),
  };
}
