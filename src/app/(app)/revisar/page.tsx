import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { ROUTES } from "@/contracts/routes";
import { FlashcardSession } from "@/features/flashcards/FlashcardSession";
import { createClient } from "@/lib/supabase/server";
import { getDueFlashcards } from "@/server/queries/flashcards";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const cards = await getDueFlashcards(user.id);

  if (cards.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">Revisões</h1>
        <Card className="flex flex-col items-start gap-3">
          <p role="status" className="text-ink">
            Nada pendente para revisar hoje. Estude um conteúdo no Mapa para liberar novos cartões.
          </p>
          <Link
            href={ROUTES.map()}
            className="inline-flex items-center justify-center rounded-pill bg-purple px-6 py-3 font-bold text-white shadow-purple hover:bg-purple-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
          >
            Ir para o Mapa
          </Link>
        </Card>
      </div>
    );
  }

  return <FlashcardSession cards={cards} />;
}
