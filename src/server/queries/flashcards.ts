import "server-only";
import { FlashcardViewSchema, type FlashcardView } from "@/contracts/views";
import { brasiliaDateString } from "@/domain/flashcard-scheduler";
import { createClient } from "@/lib/supabase/server";

type CardRow = {
  id: string;
  content_id: string;
  front: string;
  back: string;
  contents: { title: string } | { title: string }[] | null;
};

const CARD_COLUMNS = "id, content_id, front, back, contents(title)";
const FAIL = "Falha ao carregar os flashcards.";

/**
 * Fila de revisão do dia (decisão D-043), pela RLS do aluno:
 * 1) cartões com `flashcard_states.due_on <= hoje` (dia de Brasília);
 * 2) cartões SEM estado de conteúdos que o aluno está estudando (`studying`) ou dominou
 *    (`mastered`): contam como vencidos hoje.
 * Cartão com estado e `due_on` futuro fica fora. Ordem estável por `id`.
 */
export async function getDueFlashcards(userId: string): Promise<FlashcardView[]> {
  const supabase = await createClient();
  const today = brasiliaDateString(new Date());

  const { data: states, error: statesError } = await supabase
    .from("flashcard_states")
    .select("flashcard_id, due_on")
    .eq("user_id", userId);
  if (statesError) throw new Error(FAIL);
  const withState = new Set((states ?? []).map((s) => s.flashcard_id));
  const dueIds = (states ?? []).filter((s) => s.due_on <= today).map((s) => s.flashcard_id);

  const { data: progress, error: progressError } = await supabase
    .from("content_progress")
    .select("content_id")
    .eq("user_id", userId)
    .in("status", ["studying", "mastered"]);
  if (progressError) throw new Error(FAIL);
  const contentIds = (progress ?? []).map((p) => p.content_id);

  const cards = new Map<string, CardRow>();

  if (dueIds.length > 0) {
    const { data, error } = await supabase.from("flashcards").select(CARD_COLUMNS).in("id", dueIds);
    if (error) throw new Error(FAIL);
    for (const row of (data ?? []) as unknown as CardRow[]) cards.set(row.id, row);
  }

  if (contentIds.length > 0) {
    const { data, error } = await supabase
      .from("flashcards")
      .select(CARD_COLUMNS)
      .in("content_id", contentIds);
    if (error) throw new Error(FAIL);
    for (const row of (data ?? []) as unknown as CardRow[]) {
      if (!withState.has(row.id)) cards.set(row.id, row);
    }
  }

  return [...cards.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((row) => {
      const content = Array.isArray(row.contents) ? row.contents[0] : row.contents;
      return FlashcardViewSchema.parse({
        id: row.id,
        contentId: row.content_id,
        contentTitle: content?.title,
        front: row.front,
        back: row.back,
      });
    });
}
