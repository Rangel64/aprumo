import type { EssayModelUsage } from "./types";

/**
 * Registry de modelos da redação (D-010). Preços em USD por 1 milhão de tokens, copiados das
 * páginas oficiais dos provedores em `priceDate`. Preço muda: reconferir a fonte antes de decidir.
 * Sem `server-only` de propósito (o eval roda sob tsx).
 */

export type AiProviderId = "anthropic" | "google" | "openai";

/** Tarifa (US$ por 1 milhão de tokens) que passa a valer em `effectiveFrom` (AAAA-MM-DD, UTC). */
export interface RateChange {
  effectiveFrom: string;
  usdPerMTokIn: number;
  usdPerMTokOut: number;
}

/** Tarifa de prompt longo: vale para a chamada inteira quando inputTokens > aboveInputTokens. */
export interface LongPromptRate {
  aboveInputTokens: number;
  usdPerMTokIn: number;
  usdPerMTokOut: number;
}

export interface EssayModelSpec {
  provider: AiProviderId;
  /** ID da API do provedor. */
  modelId: string;
  /** Tarifa base, vigente em `priceDate` e até o primeiro `rateChanges`. */
  usdPerMTokIn: number;
  usdPerMTokOut: number;
  /** Mudanças de tarifa já anunciadas, em ordem crescente de `effectiveFrom`. */
  rateChanges?: readonly RateChange[];
  longPrompt?: LongPromptRate;
  priceSource: string;
  /** Data (AAAA-MM-DD) em que o preço foi conferido na fonte. */
  priceDate: string;
  note?: string;
}

export const ESSAY_MODELS = {
  "anthropic-haiku-5.5": {
    provider: "anthropic",
    modelId: "claude-haiku-5-5",
    usdPerMTokIn: 0.1,
    usdPerMTokOut: 0.5,
    longPrompt: { aboveInputTokens: 100_000, usdPerMTokIn: 0.5, usdPerMTokOut: 2.5 },
    priceSource: "https://platform.claude.com/docs/en/about-claude/pricing",
    priceDate: "2026-11-26",
    note: "Tarifa base para prompts de até 100 mil tokens; acima disso vale US$ 0,50 (entrada) e US$ 2,50 (saída) para a chamada inteira (o nosso prompt fica bem abaixo). ID conferido em https://platform.claude.com/docs/en/about-claude/models/overview.",
  },
  "google-gemini-3.8-flash": {
    provider: "google",
    modelId: "gemini-3.8-flash",
    usdPerMTokIn: 0.75,
    usdPerMTokOut: 3.75,
    rateChanges: [{ effectiveFrom: "2027-01-01", usdPerMTokIn: 1.5, usdPerMTokOut: 7.5 }],
    priceSource: "https://ai.google.dev/gemini-api/docs/pricing",
    priceDate: "2026-11-26",
    note: "Tarifa padrão (paga) válida até 2026-12-31; a partir de 2027-01-01 vale US$ 1,50 (entrada) e US$ 7,50 (saída), carregada em rateChanges e escolhida por data em computeCostUsd. A saída inclui tokens de raciocínio.",
  },
} as const satisfies Record<string, EssayModelSpec>;

export type EssayModelKey = keyof typeof ESSAY_MODELS;

export const ESSAY_MODEL_KEYS = Object.keys(ESSAY_MODELS) as EssayModelKey[];

export function isEssayModelKey(key: string): key is EssayModelKey {
  return Object.prototype.hasOwnProperty.call(ESSAY_MODELS, key);
}

export function getEssayModelSpec(key: string): EssayModelSpec | null {
  return isEssayModelKey(key) ? ESSAY_MODELS[key] : null;
}

export type CostSpec = Pick<EssayModelSpec, "usdPerMTokIn" | "usdPerMTokOut"> &
  Partial<Pick<EssayModelSpec, "rateChanges" | "longPrompt">>;

function isoDay(at: Date): string {
  return (Number.isNaN(at.getTime()) ? new Date() : at).toISOString().slice(0, 10);
}

/** Tarifa vigente em `at` (padrão: agora, UTC), considerando mudanças já anunciadas. */
export function resolveRate(
  spec: CostSpec,
  at: Date = new Date(),
): { usdPerMTokIn: number; usdPerMTokOut: number } {
  const day = isoDay(at);
  let rate = { usdPerMTokIn: spec.usdPerMTokIn, usdPerMTokOut: spec.usdPerMTokOut };
  for (const change of spec.rateChanges ?? []) {
    if (change.effectiveFrom <= day) {
      rate = { usdPerMTokIn: change.usdPerMTokIn, usdPerMTokOut: change.usdPerMTokOut };
    }
  }
  return rate;
}

/**
 * Custo em USD de uma chamada, a partir do usage em tokens e da data (padrão: agora). Escolhe a
 * tarifa vigente na data e, se o prompt passar do limite de prompt longo, a tarifa dessa faixa.
 * Função pura.
 */
export function computeCostUsd(spec: CostSpec, usage: EssayModelUsage, at: Date = new Date()): number {
  const base = resolveRate(spec, at);
  const rate =
    spec.longPrompt && usage.inputTokens > spec.longPrompt.aboveInputTokens ? spec.longPrompt : base;
  const cost = (usage.inputTokens * rate.usdPerMTokIn + usage.outputTokens * rate.usdPerMTokOut) / 1_000_000;
  return Math.round(cost * 1e9) / 1e9;
}
