import { redirect } from "next/navigation";
import { ROUTES } from "@/contracts/routes";
import { QuizForm } from "@/features/quiz/QuizForm";
import { createClient } from "@/lib/supabase/server";
import { getContentView } from "@/server/queries/content";
import { getQuizView } from "@/server/queries/quiz";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  // Só enunciado e alternativas chegam ao cliente; o gabarito fica no servidor.
  const [content, quiz] = await Promise.all([getContentView(slug, user.id), getQuizView(slug)]);
  return (
    <QuizForm
      quiz={quiz}
      slug={slug}
      contentTitle={content.title}
      sectionIds={content.sections.map((s) => s.id)}
    />
  );
}
