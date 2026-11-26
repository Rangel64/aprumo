import type { ActionResult } from "@/contracts/errors";
import { ROUTES } from "@/contracts/routes";

export type AddToJourneyOutcome =
  | { kind: "added"; message: string }
  | { kind: "already"; message: string }
  | { kind: "redirect"; href: string }
  | { kind: "error"; message: string };

export const ADD_MESSAGES = {
  added: "Adicionado à sua Jornada",
  already: "Já está na sua Jornada",
  error: "Não foi possível adicionar agora. Tente de novo.",
} as const;

/** Decide a reação da UI ao resultado de `addContentsToJourney` (sem expor detalhes do erro). */
export function decideAddToJourney(
  result: ActionResult<{ journeyId: string; added: number }>,
  slug: string,
): AddToJourneyOutcome {
  if (result.ok) {
    return result.data.added > 0
      ? { kind: "added", message: ADD_MESSAGES.added }
      : { kind: "already", message: ADD_MESSAGES.already };
  }
  if (result.error.code === "NO_ACTIVE_JOURNEY") {
    return { kind: "redirect", href: ROUTES.newJourney({ conteudos: [slug] }) };
  }
  return { kind: "error", message: ADD_MESSAGES.error };
}
