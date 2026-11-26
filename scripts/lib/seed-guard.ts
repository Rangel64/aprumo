/**
 * Travas de segurança do seed (T4). Funções puras: recebem url/argv/env, devolvem decisão.
 * As mensagens NUNCA incluem a URL, o host, chaves, e-mail ou senha.
 */

export const ALLOW_REMOTE_FLAG = "--allow-remote";
export const REMOTE_CONFIRM_VAR = "SEED_CONFIRM_REMOTE";
export const REMOTE_CONFIRM_VALUE = "yes-seed-remote";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Domínios e sufixos reservados (RFC 2606/6761): nunca entregam e-mail real (RNF-017). */
const RESERVED_DOMAINS = new Set(["example.com", "example.org", "example.net"]);
const RESERVED_SUFFIXES = [".example", ".test", ".invalid", ".localhost"];

export class SeedGuardError extends Error {}

export function isLocalUrl(url: URL): boolean {
  return LOCAL_HOSTS.has(url.hostname.toLowerCase());
}

/**
 * Decide se o seed pode escrever no alvo. Lança SeedGuardError (sem expor a URL) se não puder.
 * - qualquer URL com "prod" (host, caminho ou nome do projeto) é recusada sempre;
 * - local (localhost/127.0.0.1) passa;
 * - remota só com `--allow-remote` E `SEED_CONFIRM_REMOTE=yes-seed-remote` no ambiente.
 */
export function assertSafeTarget(input: {
  url: string;
  argv: readonly string[];
  env: Record<string, string | undefined>;
}): { local: boolean } {
  let parsed: URL;
  try {
    parsed = new URL(input.url);
  } catch {
    throw new SeedGuardError("NEXT_PUBLIC_SUPABASE_URL não é uma URL válida.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SeedGuardError("NEXT_PUBLIC_SUPABASE_URL deve usar http ou https.");
  }

  if (input.url.toLowerCase().includes("prod")) {
    throw new SeedGuardError(
      "Recusado: o destino parece ser de produção (nome contém \"prod\"). O seed de produção é manual e fora deste script.",
    );
  }

  if (isLocalUrl(parsed)) return { local: true };

  const hasFlag = input.argv.includes(ALLOW_REMOTE_FLAG);
  const confirmed = input.env[REMOTE_CONFIRM_VAR] === REMOTE_CONFIRM_VALUE;
  if (!hasFlag || !confirmed) {
    throw new SeedGuardError(
      `Recusado: o destino não é local. Para um banco remoto de desenvolvimento use ${ALLOW_REMOTE_FLAG} e defina ${REMOTE_CONFIRM_VAR}=${REMOTE_CONFIRM_VALUE} no ambiente.`,
    );
  }
  return { local: false };
}

export function isReservedEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return RESERVED_DOMAINS.has(domain) || RESERVED_SUFFIXES.some((s) => domain.endsWith(s));
}

export interface SeedEnv {
  url: string;
  serviceRoleKey: string;
  demoEmail: string;
  demoPassword: string;
}

/** Lê e valida as variáveis obrigatórias. Só os NOMES faltantes aparecem na mensagem. */
export function readSeedEnv(env: Record<string, string | undefined>): SeedEnv {
  const names = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DEMO_USER_EMAIL",
    "DEMO_USER_PASSWORD",
  ] as const;
  const missing = names.filter((n) => !env[n] || env[n]!.trim() === "");
  if (missing.length > 0) {
    throw new SeedGuardError(
      `Defina no ambiente do shell (nunca no código): ${missing.join(", ")}.`,
    );
  }
  const demoEmail = env.DEMO_USER_EMAIL!.trim();
  if (!isReservedEmail(demoEmail)) {
    throw new SeedGuardError(
      "DEMO_USER_EMAIL deve usar domínio reservado (example.com, example.org, example.net, .test ou .example): dados fictícios (RNF-017).",
    );
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY!,
    demoEmail,
    demoPassword: env.DEMO_USER_PASSWORD!,
  };
}
