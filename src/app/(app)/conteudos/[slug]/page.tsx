import { redirect } from "next/navigation";
import { ROUTES } from "@/contracts/routes";
import { ContentPage } from "@/features/study/ContentPage";
import { createClient } from "@/lib/supabase/server";
import { getContentView } from "@/server/queries/content";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.signIn);

  const data = await getContentView(slug, user.id);
  return <ContentPage data={data} />;
}
