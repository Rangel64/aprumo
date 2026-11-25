import { describe, expect, it } from "vitest";
import type { MapView } from "@/contracts/views";
import {
  buildFlowElements,
  filterNodes,
  getNodeDetails,
  parseStateFilter,
  type MapTrail,
} from "../map-model";

const TRAIL = "00000000-0000-4000-8000-0000000000a1";
const A = "00000000-0000-4000-8000-0000000000c1";
const B = "00000000-0000-4000-8000-0000000000c2";
const C = "00000000-0000-4000-8000-0000000000c3";

// A dominado, B estudando, C não iniciado. A->B e B->C pré-requisito; A~C relacionado.
const view: MapView = {
  nodes: [
    { id: A, slug: "a", title: "Conteúdo A", status: "mastered", reviewedToday: true, position: { x: 0, y: 10 }, trailIds: [TRAIL], competencies: [2] },
    { id: B, slug: "b", title: "Conteúdo B", status: "studying", reviewedToday: false, position: { x: 280, y: 20 }, trailIds: [TRAIL], competencies: [] },
    { id: C, slug: "c", title: "Conteúdo C", status: "not_started", reviewedToday: false, position: { x: 560, y: 30 }, trailIds: [], competencies: [3] },
  ],
  edges: [
    { from: A, to: B, kind: "prerequisite" },
    { from: B, to: C, kind: "prerequisite" },
    { from: A, to: C, kind: "related" },
  ],
};
const trails: MapTrail[] = [{ id: TRAIL, slug: "t", name: "Trilha T", contentCount: 2 }];

describe("parseStateFilter", () => {
  it("aceita os quatro valores do contrato", () => {
    for (const v of ["todos", "dominado", "estudando", "nao-iniciado"] as const) {
      expect(parseStateFilter(v)).toBe(v);
    }
  });

  it("ausente, inválido, bloqueado ou vazio viram todos; lista usa o primeiro", () => {
    expect(parseStateFilter(undefined)).toBe("todos");
    expect(parseStateFilter("bloqueado")).toBe("todos");
    expect(parseStateFilter("")).toBe("todos");
    expect(parseStateFilter("DOMINADO")).toBe("todos");
    expect(parseStateFilter(["estudando", "dominado"])).toBe("estudando");
    expect(parseStateFilter([])).toBe("todos");
  });
});

describe("filterNodes", () => {
  it("todos devolve os 3 nós", () => {
    expect(filterNodes(view.nodes, "todos")).toHaveLength(3);
  });

  it("cada estado devolve só o nó do estado (1 de cada na fixture)", () => {
    expect(filterNodes(view.nodes, "dominado").map((n) => n.id)).toEqual([A]);
    expect(filterNodes(view.nodes, "estudando").map((n) => n.id)).toEqual([B]);
    expect(filterNodes(view.nodes, "nao-iniciado").map((n) => n.id)).toEqual([C]);
  });

  it("sem nós no estado, a lista é vazia", () => {
    const onlyMastered = view.nodes.filter((n) => n.status === "mastered");
    expect(filterNodes(onlyMastered, "estudando")).toEqual([]);
  });
});

describe("buildFlowElements", () => {
  it("todos: 3 nós nas posições do seed e 3 arestas", () => {
    const { nodes, edges } = buildFlowElements(view, "todos");
    expect(nodes.map((n) => n.position)).toEqual([
      { x: 0, y: 10 },
      { x: 280, y: 20 },
      { x: 560, y: 30 },
    ]);
    expect(nodes.every((n) => n.type === "content")).toBe(true);
    expect(nodes[0].data).toMatchObject({ slug: "a", status: "mastered", reviewedToday: true });
    expect(edges).toHaveLength(3);
  });

  it("pré-requisito é cheio e relacionada é tracejada", () => {
    const { edges } = buildFlowElements(view, "todos");
    const pre = edges.filter((e) => e.className === "edge-prerequisite");
    const rel = edges.filter((e) => e.className === "edge-related");
    expect(pre).toHaveLength(2);
    expect(rel).toHaveLength(1);
    expect(pre.every((e) => e.style.strokeDasharray === undefined)).toBe(true);
    expect(rel[0].style.strokeDasharray).toBeDefined();
    expect(rel[0]).toMatchObject({ source: A, target: C });
  });

  it("filtrado, só ficam arestas com as duas pontas visíveis", () => {
    // Com um único nó visível (A), nenhuma aresta tem as duas pontas.
    const { nodes, edges } = buildFlowElements(view, "dominado");
    expect(nodes).toHaveLength(1);
    expect(edges).toEqual([]);
  });

  it("ids de aresta são únicos", () => {
    const { edges } = buildFlowElements(view, "todos");
    expect(new Set(edges.map((e) => e.id)).size).toBe(edges.length);
  });
});

describe("getNodeDetails", () => {
  it("pré-requisitos vêm do grafo completo e Trilhas pelo trailIds", () => {
    const d = getNodeDetails(view, trails, B);
    expect(d?.prerequisites).toEqual([{ slug: "a", title: "Conteúdo A" }]);
    expect(d?.trails.map((t) => t.slug)).toEqual(["t"]);
  });

  it("relacionada não conta como pré-requisito; sem Trilha, lista vazia", () => {
    const d = getNodeDetails(view, trails, C);
    expect(d?.prerequisites).toEqual([{ slug: "b", title: "Conteúdo B" }]);
    expect(d?.trails).toEqual([]);
  });

  it("nó sem pré-requisito e id inexistente", () => {
    expect(getNodeDetails(view, trails, A)?.prerequisites).toEqual([]);
    expect(getNodeDetails(view, trails, "x")).toBeNull();
  });
});
