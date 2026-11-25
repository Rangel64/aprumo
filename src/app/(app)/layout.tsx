import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { AppNav } from "@/features/auth/AppNav";
import { DemoNotice } from "@/features/auth/demo";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { createClient } from "@/lib/supabase/server";

/** Layout das rotas autenticadas: menu lateral (desktop), barra inferior (celular), Sair. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.display_name?.trim() || "Aluno";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-line bg-white px-4 py-3 md:w-64 md:shrink-0 md:gap-6 md:border-r md:border-b-0 md:px-5 md:py-6">
        <div className="flex items-center justify-between gap-3 md:block">
          <Brand href={ROUTES.dashboard} />
          <p className="truncate text-sm font-bold text-ink md:mt-4" title={displayName}>
            <span className="font-normal text-muted">Olá, </span>
            {displayName}
          </p>
        </div>
        <AppNav />
        <SignOutButton className="md:mt-auto" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <DemoNotice className="m-4 mb-0" />
        <main id="conteudo" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
