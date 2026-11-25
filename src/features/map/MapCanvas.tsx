"use client";

import "@xyflow/react/dist/style.css";
import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { MapNode } from "@/components/ui";
import type { MapStateFilter } from "@/contracts/routes";
import type { MapView } from "@/contracts/views";
import {
  buildFlowElements,
  getNodeDetails,
  type FlowNodeData,
  type MapTrail,
} from "./map-model";
import { NodeDrawer } from "./NodeDrawer";

type ContentFlowNode = Node<FlowNodeData, "content">;

const hiddenHandle = { opacity: 0, pointerEvents: "none" } as const;

/**
 * Nó do Mapa: o MapNode de A dentro de um botão (teclado nativo: Tab, Enter, Espaço).
 * O clique (mouse ou teclado, que gera click no botão) sobe até o nó e é tratado em onNodeClick;
 * com onNodeClick o React Flow mantém pointer-events nos nós mesmo sem arrastar/selecionar.
 */
function ContentNode({ data }: NodeProps<ContentFlowNode>) {
  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} style={hiddenHandle} />
      <button
        type="button"
        data-map-node={data.slug}
        className="nodrag nopan pointer-events-auto cursor-pointer rounded-md p-2 hover:bg-purple-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
      >
        <MapNode status={data.status} label={data.title} reviewedToday={data.reviewedToday} />
      </button>
      <Handle type="source" position={Position.Right} isConnectable={false} style={hiddenHandle} />
    </>
  );
}

// Fora do componente: React Flow exige referência estável.
const nodeTypes = { content: ContentNode };

/**
 * Grafo do Mapa. Posições do seed, sem layout automático. O viewport do flow é contido
 * (overflow oculto, rolagem da página livre: zoom pelos controles), sem rolagem horizontal.
 */
export function MapCanvas({
  view,
  filter,
  trails,
}: {
  view: MapView;
  filter: MapStateFilter;
  trails: MapTrail[];
}) {
  const { nodes, edges } = useMemo(() => buildFlowElements(view, filter), [view, filter]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const onNodeClick = useCallback((e: React.MouseEvent, node: Node) => {
    const button = (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-map-node]");
    triggerRef.current = button;
    setSelectedId((node.data as FlowNodeData).id);
    // Clique de mouse não foca o botão em todos os navegadores; garante o ponto de retorno.
    button?.focus({ preventScroll: true });
  }, []);

  const details = selectedId ? getNodeDetails(view, trails, selectedId) : null;

  function close() {
    const slug = details?.node.slug;
    const trigger = triggerRef.current;
    setSelectedId(null);
    // Devolve o foco ao nó que abriu o drawer; se o botão saiu do DOM, procura pelo slug.
    queueMicrotask(() => {
      let target: HTMLElement | null = null;
      if (trigger?.isConnected) target = trigger;
      else if (slug) {
        target = document.querySelector<HTMLElement>(`[data-map-node="${CSS.escape(slug)}"]`);
      }
      target?.focus();
    });
  }

  return (
    <>
      <div
        role="region"
        aria-label="Mapa de conteúdos"
        className="h-[28rem] w-full overflow-hidden rounded-lg bg-white shadow-card md:h-[34rem]"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          preventScrolling={false}
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {details && <NodeDrawer details={details} onClose={close} />}
    </>
  );
}
