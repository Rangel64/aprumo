import { cn } from "@/components/ui";

/** Modo demo (RNF-017): lido do build; só o nome literal é inlinado pelo Next. */
export function isDemoMode(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_MODE;
  return v === "true" || v === "1";
}

export const DEMO_NOTICE_TEXT =
  "Esta é uma demonstração com dados fictícios. Não informe dados pessoais reais.";

export function DemoNotice({ className }: { className?: string }) {
  if (!isDemoMode()) return null;
  return (
    <p
      role="note"
      className={cn(
        "rounded-md border border-yellow bg-yellow-light px-4 py-2 text-sm font-semibold text-ink",
        className,
      )}
    >
      {DEMO_NOTICE_TEXT}
    </p>
  );
}
