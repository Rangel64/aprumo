"use server";

import { AuthInputSchema, type AuthResult } from "@/contracts/actions";
import { fail, ok, type ActionResult } from "@/contracts/errors";
import { ROUTES } from "@/contracts/routes";
import { createClient } from "@/lib/supabase/server";

const MSG = {
  email: "Informe um e-mail válido.",
  password: "A senha precisa ter pelo menos 6 caracteres e no máximo 72 bytes (acentos e emojis ocupam mais de um).",
  needsConfirmation:
    "Sua conta foi criada, mas precisa confirmar o e-mail. Verifique a caixa de entrada.",
  displayName: "O nome deve ter de 1 a 80 caracteres.",
  form: "Confira os dados informados.",
  emailTaken: "Este e-mail já tem cadastro. Entre na sua conta.",
  badCredentials: "E-mail ou senha incorretos.",
  weakPassword: "Senha fraca demais. Use pelo menos 6 caracteres.",
  rateLimit: "Muitas tentativas. Aguarde um instante e tente de novo.",
  internal: "Não foi possível concluir agora. Tente de novo em instantes.",
} as const;

/** Converte a falha do zod em erro de campo pt-BR (nunca devolve texto do zod). */
function validationFailure(
  issues: ReadonlyArray<{ path: PropertyKey[] }>,
): ActionResult<never> {
  const first = issues[0]?.path[0];
  if (first === "email") return fail("VALIDATION", MSG.email, "email");
  if (first === "password") return fail("VALIDATION", MSG.password, "password");
  if (first === "displayName") return fail("VALIDATION", MSG.displayName, "displayName");
  return fail("VALIDATION", MSG.form);
}

type ProviderError = { code?: string; status?: number } | null;

/** Mapeia o erro do Supabase Auth por `code`/`status`. A mensagem crua nunca sai. */
function mapProviderError(error: NonNullable<ProviderError>): ActionResult<never> {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return fail("CONFLICT", MSG.emailTaken, "email");
    case "email_not_confirmed":
      return fail("UNAUTHENTICATED", MSG.needsConfirmation);
    case "invalid_credentials":
      return fail("UNAUTHENTICATED", MSG.badCredentials);
    case "weak_password":
      return fail("VALIDATION", MSG.weakPassword, "password");
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return fail("INTERNAL", MSG.rateLimit);
    default:
      return error.status === 429
        ? fail("INTERNAL", MSG.rateLimit)
        : fail("INTERNAL", MSG.internal);
  }
}

export async function signUp(input: unknown): Promise<ActionResult<AuthResult>> {
  const parsed = AuthInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error.issues);
  const { email, password, displayName } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // O trigger do banco lê `display_name` de raw_user_meta_data.
      options: displayName ? { data: { display_name: displayName } } : undefined,
    });
    if (error) return mapProviderError(error);
    // Com confirmação de e-mail ligada o Supabase devolve usuário "ofuscado" sem identities.
    if (data.user && data.user.identities?.length === 0) {
      return fail("CONFLICT", MSG.emailTaken, "email");
    }
    // Sem sessão a conta ainda não está ativa (confirmação de e-mail ligada no projeto).
    if (!data.session) return fail("UNAUTHENTICATED", MSG.needsConfirmation);
    return ok({ redirectTo: ROUTES.newJourney() });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}

export async function signIn(input: unknown): Promise<ActionResult<AuthResult>> {
  const parsed = AuthInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error.issues);
  const { email, password } = parsed.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return mapProviderError(error);
    return ok({ redirectTo: ROUTES.dashboard });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}

export async function signOut(): Promise<ActionResult<AuthResult>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return mapProviderError(error);
    return ok({ redirectTo: ROUTES.signIn });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}
