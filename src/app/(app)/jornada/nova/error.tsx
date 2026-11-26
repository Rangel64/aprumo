"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ retry }: { error: Error; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <h1 className="font-display text-3xl font-bold text-ink">Não foi possível abrir o formulário</h1>
      <p className="text-muted">Tente de novo em instantes.</p>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </div>
  );
}
