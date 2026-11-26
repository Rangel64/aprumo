import { redirect } from "next/navigation";
import { ROUTES } from "@/contracts/routes";
import { brasiliaDateString } from "@/domain/flashcard-scheduler";
import { ScheduleNoJourney, ScheduleScreen } from "@/features/schedule/ScheduleScreen";
import { createClient } from "@/lib/supabase/server";
import { getScheduleView } from "@/server/queries/schedule";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const view = await getScheduleView(user.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold text-ink">Seu cronograma</h1>
      {view.journeyId ? (
        <ScheduleScreen view={view} today={brasiliaDateString(new Date())} />
      ) : (
        <ScheduleNoJourney />
      )}
    </div>
  );
}
