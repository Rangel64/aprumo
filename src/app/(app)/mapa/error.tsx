"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <h1 className="font-display text-3xl font-bold text-ink">Não foi possível abrir o Mapa</h1>
      <p className="text-muted">Tente de novo em instantes.</p>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
