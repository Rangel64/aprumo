import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { QuizViewSchema, type QuizView } from "@/contracts/views";
import { createClient } from "@/lib/supabase/server";
import { getAppConfig } from "@/server/config";

const OptionsSchema = z.array(z.string().min(1)).min(2);

/**
 * Mini-simulado de um conteúdo, SEM gabarito. Seleciona só colunas públicas de `questions`
 * (id, stem, options): `correct_index` e explicação vivem em `question_keys`, que nunca é
 * lida aqui. A quantidade exata vem de `app_config.quiz_question_count`.
 *
 * `questions` não tem coluna de ordem: a ordem estável é por `id`, e o conteúdo precisa ter
 * exatamente N questões. `submitQuizAttempt` usa a mesma regra para validar o conjunto.
 * Conteúdo inexistente (ou sem questões): notFound().
 */
export async function getQuizView(slug: string): Promise<QuizView> {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from("contents")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Falha ao carregar o mini-simulado.");
  if (!content) notFound();

  const config = await getAppConfig();

  const { data: rows, error: questionsError } = await supabase
    .from("questions")
    .select("id, stem, options")
    .eq("content_id", content.id)
    .order("id")
    .limit(config.quiz_question_count + 1);
  if (questionsError) throw new Error("Falha ao carregar o mini-simulado.");
  // Exige EXATAMENTE quiz_question_count questões (hoje, 5); menos ou mais = notFound,
  // consistente com submitQuizAttempt (sem simulado parcial nem truncado).
  if (!rows || rows.length !== config.quiz_question_count) notFound();

  const questions = rows.map((q) => {
    const options = OptionsSchema.safeParse(q.options);
    if (!options.success) throw new Error("Falha ao carregar o mini-simulado.");
    return { id: q.id, stem: q.stem, options: options.data };
  });

  return QuizViewSchema.parse({ contentId: content.id, questions });
}
