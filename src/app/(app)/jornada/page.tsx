import { redirect } from "next/navigation";
import { ROUTES } from "@/contracts/routes";
import { brasiliaDateString } from "@/domain/flashcard-scheduler";
import { JourneyEmpty, JourneyRoadmap } from "@/features/journey/JourneyRoadmap";
import { createClient } from "@/lib/supabase/server";
import { getActiveJourney } from "@/server/queries/journey";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const journey = await getActiveJourney(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold text-ink">Minha Jornada</h1>
      {journey ? (
        <JourneyRoadmap journey={journey} today={brasiliaDateString(new Date())} />
      ) : (
        <JourneyEmpty />
      )}
    </div>
  );
}
