/** Lógica pura da Jornada (US-011): validação do formulário, pré-seleção por URL e prazos. */
import { brasiliaDateString } from "@/domain/flashcard-scheduler";

export const GOAL_MIN = 3;
export const GOAL_MAX = 200;
const MAX_SLUGS = 50;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type CatalogContent = { id: string; slug: string; title: string };
export type CatalogTrail = {
  id: string;
  slug: string;
  name: string;
  objective: string;
};
export type Catalog = { trails: CatalogTrail[]; contents: CatalogContent[] };

export type BaseType = "trail" | "contents";

export type Preselect = {
  baseType: BaseType;
  trailId: string | null;
  contentIds: string[];
};

/** Aceita `a,b,c` (ou valor repetido); descarta formato inválido, repetidos e excesso. */
export function parseSlugList(raw: string | string[] | undefined): string[] {
  const text = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const out: string[] = [];
  for (const part of text.split(",")) {
    const slug = part.trim();
    if (slug.length === 0 || slug.length > 100 || !SLUG_RE.test(slug)) continue;
    if (!out.includes(slug)) out.push(slug);
    if (out.length >= MAX_SLUGS) break;
  }
  return out;
}

type Query = Record<string, string | string[] | undefined>;

/**
 * Pré-seleção a partir de `?trilha=<slug>&conteudos=<slug,slug>`. Slugs fora do catálogo são
 * ignorados. Trilha válida define a base "Trilha"; senão, conteúdos válidos definem "Conteúdos";
 * sem nada válido, a base padrão é a Trilha (se existir) ou os conteúdos.
 */
export function resolvePreselect(catalog: Catalog, query: Query): Preselect {
  const trailSlug = parseSlugList(query.trilha)[0];
  const trail = trailSlug ? catalog.trails.find((t) => t.slug === trailSlug) : undefined;
  const wanted = parseSlugList(query.conteudos);
  const contentIds = catalog.contents.filter((c) => wanted.includes(c.slug)).map((c) => c.id);

  if (trail) return { baseType: "trail", trailId: trail.id, contentIds };
  if (contentIds.length > 0) {
    return {
      baseType: "contents",
      trailId: catalog.trails[0]?.id ?? null,
      contentIds,
    };
  }
  if (catalog.trails.length > 0) {
    return { baseType: "trail", trailId: catalog.trails[0].id, contentIds: [] };
  }
  return { baseType: "contents", trailId: null, contentIds: [] };
}

// Datas (AAAA-MM-DD, sem fuso: o "hoje" de Brasília é injetado pelo chamador).

function parseIso(iso: string): number | null {
  const m = ISO_DATE_RE.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    return null;
  }
  return t;
}

export function isValidIsoDate(iso: string): boolean {
  return parseIso(iso) !== null;
}

export function addDays(iso: string, days: number): string {
  const t = parseIso(iso);
  if (t === null) return iso;
  const d = new Date(t + days * 86_400_000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getUTCFullYear(), 4)}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

/** Menor prazo aceito: amanhã (o prazo precisa ser depois de hoje). */
export function minDeadline(today: string): string {
  return addDays(today, 1);
}

/** `2099-12-31` -> `31/12/2099`. Valor inválido volta como veio. */
export function formatDeadline(iso: string): string {
  const m = ISO_DATE_RE.exec(iso);
  return m && isValidIsoDate(iso) ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Dias inteiros de `today` até `deadline` (negativo = vencido). `null` se alguma data é inválida. */
export function daysRemaining(deadline: string, today: string): number | null {
  const a = parseIso(deadline);
  const b = parseIso(today);
  if (a === null || b === null) return null;
  return Math.round((a - b) / 86_400_000);
}

export function remainingLabel(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "vence hoje";
  if (days === 1) return "falta 1 dia";
  if (days > 1) return `faltam ${days} dias`;
  const late = -days;
  return late === 1 ? "prazo vencido há 1 dia" : `prazo vencido há ${late} dias`;
}

// Formulário

export type FormValues = {
  baseType: BaseType;
  trailId: string | null;
  contentIds: string[];
  goal: string;
  deadline: string;
};

export type FormField = "base" | "goal" | "deadline";
export type FormErrors = Partial<Record<FormField, string>>;

export const MSG = {
  goalRequired: "A meta é obrigatória: descreva o que você quer alcançar (de 3 a 200 caracteres).",
  goalShort: "A meta precisa ter pelo menos 3 caracteres.",
  goalLong: "A meta pode ter no máximo 200 caracteres.",
  deadlineRequired: "O prazo é obrigatório: escolha uma data a partir de amanhã.",
  deadlineInvalid: "Informe uma data válida.",
  deadlinePast: "O prazo precisa ser a partir de amanhã.",
  baseTrail: "Escolha uma Trilha.",
  baseContents: "Escolha pelo menos um conteúdo.",
} as const;

/** Valida o formulário com as mesmas regras da action (RN-002). `today` é o dia em Brasília. */
export function validateForm(v: FormValues, today: string): FormErrors {
  const errors: FormErrors = {};

  if (v.baseType === "trail") {
    if (!v.trailId) errors.base = MSG.baseTrail;
  } else if (v.contentIds.length < 1) {
    errors.base = MSG.baseContents;
  }

  const goal = v.goal.trim();
  if (goal.length === 0) errors.goal = MSG.goalRequired;
  else if (goal.length < GOAL_MIN) errors.goal = MSG.goalShort;
  else if (goal.length > GOAL_MAX) errors.goal = MSG.goalLong;

  if (v.deadline.trim() === "") errors.deadline = MSG.deadlineRequired;
  else if (!isValidIsoDate(v.deadline)) errors.deadline = MSG.deadlineInvalid;
  else if (v.deadline <= today) errors.deadline = MSG.deadlinePast;

  return errors;
}

/** Entrada da action `createJourney` a partir de valores já válidos. */
export function buildCreateInput(v: FormValues) {
  return {
    base:
      v.baseType === "trail"
        ? { type: "trail" as const, trailId: v.trailId as string }
        : { type: "contents" as const, contentIds: v.contentIds },
    goalDescription: v.goal.trim(),
    deadline: v.deadline,
    methodology: "none" as const,
  };
}

/** Campo do formulário a que um `error.field` da action se refere. */
export function fieldFromActionError(field: string | undefined): FormField | null {
  if (!field) return null;
  if (field === "goalDescription") return "goal";
  if (field === "deadline") return "deadline";
  if (field === "base" || field.startsWith("base.")) return "base";
  return null;
}

/** Validação com "hoje" (America/Sao_Paulo) calculado a partir de `now`, não fixado na renderização. */
export function validateFormAt(v: FormValues, now: Date): FormErrors {
  return validateForm(v, brasiliaDateString(now));
}

/** Menor prazo aceito (amanhã em Brasília) segundo `now`. */
export function minDeadlineAt(now: Date): string {
  return minDeadline(brasiliaDateString(now));
}
