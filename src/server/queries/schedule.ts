import type { ScheduleView } from "@/contracts/views";
import { buildSchedule } from "@/domain/schedule";
import { createClient } from "@/lib/supabase/server";
import { brasiliaDayRange } from "@/features/map/reviewed-today";

const LOAD_ERROR = "Falha ao carregar o cronograma.";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cronograma do aluno. Só leitura, cliente com sessão (RLS), sempre filtrado por `userId`.
 * `sessions` = sessões da Jornada ativa de hoje (00:00 de Brasília) até 7 dias depois, em ordem
 * cronológica; a UI separa dia e semana. `deadlineAtRisk` é recalculado (não persistido) com
 * `buildSchedule` sobre a disponibilidade atual e os conteúdos ainda não dominados.
 * Sem Jornada ativa: `journeyId` ausente, sem sessões e sem risco. Nunca escreve em `content_progress`.
 */
export async function getScheduleView(userId: string): Promise<ScheduleView> {
  const supabase = await createClient();
  const now = new Date();

  const [slotsRes, journeyRes] = await Promise.all([
    supabase.from("availability_slots").select("weekday, start_time, minutes").eq("user_id", userId),
    supabase
      .from("journeys")
      .select("id, deadline")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (slotsRes.error || journeyRes.error) throw new Error(LOAD_ERROR);

  const slots = (slotsRes.data ?? []).map((s) => ({
    weekday: s.weekday,
    startTime: s.start_time,
    minutes: s.minutes,
  }));
  const hasAvailability = slots.length > 0;
  const journey = journeyRes.data;
  if (!journey) return { hasAvailability, sessions: [], deadlineAtRisk: false };

  const from = brasiliaDayRange(now).start;
  const to = new Date(from.getTime() + WEEK_MS);
  const [sessionsRes, linksRes, masteredRes] = await Promise.all([
    supabase
      .from("schedule_sessions")
      .select("id, starts_at, minutes, status, contents(slug, title)")
      .eq("user_id", userId)
      .eq("journey_id", journey.id)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString())
      .order("starts_at"),
    supabase.from("journey_contents").select("content_id, position").eq("journey_id", journey.id).order("position"),
    supabase.from("content_progress").select("content_id").eq("user_id", userId).eq("status", "mastered"),
  ]);
  if (sessionsRes.error || linksRes.error || masteredRes.error) throw new Error(LOAD_ERROR);

  const sessions: ScheduleView["sessions"] = [];
  for (const row of sessionsRes.data ?? []) {
    const c = Array.isArray(row.contents) ? row.contents[0] : row.contents;
    if (!c) continue;
    sessions.push({
      id: row.id,
      startsAt: new Date(row.starts_at).toISOString(),
      minutes: row.minutes,
      contentSlug: c.slug,
      contentTitle: c.title,
      status: row.status === "done" ? "done" : "planned",
    });
  }
  sessions.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const mastered = new Set((masteredRes.data ?? []).map((r) => r.content_id));
  const pendingContents = (linksRes.data ?? [])
    .filter((l) => !mastered.has(l.content_id))
    .map((l) => ({ id: l.content_id }));
  const { deadlineAtRisk } = hasAvailability
    ? buildSchedule({ slots, pendingContents, deadline: journey.deadline, today: now })
    : { deadlineAtRisk: false };

  return { hasAvailability, journeyId: journey.id, sessions, deadlineAtRisk };
}
