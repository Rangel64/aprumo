import type { ReactNode } from "react";
import { Brand, Card } from "@/components/ui";
import { DemoNotice } from "./demo";

/** Moldura das telas Entrar e Cadastro. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-8">
      <header className="mb-8 w-full max-w-md">
        <Brand />
      </header>
      <main className="w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-2 mb-6 text-muted">{subtitle}</p>
          <DemoNotice className="mb-6" />
          {children}
        </Card>
      </main>
    </div>
  );
}
