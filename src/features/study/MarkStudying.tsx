"use client";

import { useEffect } from "react";
import { markStudying } from "@/server/actions/study";

/** Registra "estudando" ao abrir o conteúdo. Silencioso: falha não atrapalha a leitura. */
export function MarkStudying({ contentId }: { contentId: string }) {
  useEffect(() => {
    void markStudying({ contentId });
  }, [contentId]);
  return null;
}
