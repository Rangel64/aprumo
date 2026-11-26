import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import {
  AiSdkEssayModel,
  DEFAULT_AI_TIMEOUT_MS,
  MAX_AI_TIMEOUT_MS,
  MIN_AI_TIMEOUT_MS,
} from "./ai-sdk-essay-model";
import { FakeEssayModel } from "./fake-essay-model";
import {
  ESSAY_MODEL_KEYS,
  getEssayModelSpec,
  type AiProviderId,
  type EssayModelSpec,
} from "./models";
import { EssayModelError, type EssayFeedbackModel } from "./types";

/**
 * Fábrica do modelo da redação por env. Sem `server-only` de propósito (o eval roda sob tsx); o
 * app importa por `./server`. Nunca loga nem inclui valor de chave em erros: só o NOME da variável.
 */

export type EssayEnv = Readonly<Record<string, string | undefined>>;

/** Nome da variável de ambiente com a chave de cada provedor (nomes padrão do AI SDK). */
export const PROVIDER_KEY_ENV: Record<AiProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
};

export interface EssayAiConfig {
  provider: "fake" | "ai-sdk";
  modelKey: string | null;
  timeoutMs: number;
}

export function resolveTimeoutMs(env: EssayEnv): number {
  const raw = env.AI_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_AI_TIMEOUT_MS;
  // Só dígitos decimais: recusa "Infinity", "0x10", "5e9", sinais e decimais. Valor inválido ou fora
  // de [1000, 55000] gera CONFIG claro (não cai em silêncio no padrão), sem repetir o valor.
  const value = /^\d{1,10}$/.test(raw) ? Number(raw) : Number.NaN;
  if (!Number.isInteger(value) || value < MIN_AI_TIMEOUT_MS || value > MAX_AI_TIMEOUT_MS) {
    throw new EssayModelError(
      "CONFIG",
      `AI_TIMEOUT_MS deve ser um inteiro em milissegundos entre ${MIN_AI_TIMEOUT_MS} e ${MAX_AI_TIMEOUT_MS}.`,
    );
  }
  return value;
}

let warnedFakeDefault = false;
/** Só para testes: reabre o aviso único do padrão Fake. */
export function resetFakeDefaultWarningForTests(): void {
  warnedFakeDefault = false;
}

export function readEssayAiConfig(env: EssayEnv): EssayAiConfig {
  const provider = (env.AI_PROVIDER?.trim() || "fake").toLowerCase();
  if (provider !== "fake" && provider !== "ai-sdk") {
    throw new EssayModelError("CONFIG", "AI_PROVIDER inválido: use 'fake' ou 'ai-sdk'.");
  }
  return {
    provider,
    modelKey: env.AI_ESSAY_MODEL_KEY?.trim() || null,
    timeoutMs: resolveTimeoutMs(env),
  };
}

/** Recusa modelKey desconhecida com erro claro (lista as chaves válidas, que são públicas). */
export function requireModelSpec(modelKey: string | null): { key: string; spec: EssayModelSpec } {
  if (!modelKey) {
    throw new EssayModelError(
      "CONFIG",
      `AI_ESSAY_MODEL_KEY é obrigatória com AI_PROVIDER=ai-sdk. Válidas: ${ESSAY_MODEL_KEYS.join(", ")}.`,
    );
  }
  const spec = getEssayModelSpec(modelKey);
  if (!spec) {
    throw new EssayModelError(
      "CONFIG",
      `AI_ESSAY_MODEL_KEY desconhecida (valor omitido de propósito). Válidas: ${ESSAY_MODEL_KEYS.join(", ")}.`,
    );
  }
  return { key: modelKey, spec };
}

function buildLanguageModel(spec: EssayModelSpec, env: EssayEnv): LanguageModel {
  const keyName = PROVIDER_KEY_ENV[spec.provider];
  const apiKey = env[keyName];
  if (!apiKey) {
    throw new EssayModelError("CONFIG", `Variável ${keyName} ausente para o provedor ${spec.provider}.`);
  }
  switch (spec.provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(spec.modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(spec.modelId);
    case "openai":
      return createOpenAI({ apiKey })(spec.modelId);
  }
}

/** Cria o adapter de uma modelKey específica (usado pelo eval para comparar os 2 candidatos). */
export function createAiSdkEssayModel(
  modelKey: string,
  env: EssayEnv,
  timeoutMs: number = resolveTimeoutMs(env),
): EssayFeedbackModel {
  const { key, spec } = requireModelSpec(modelKey);
  return new AiSdkEssayModel({ modelKey: key, model: buildLanguageModel(spec, env), timeoutMs });
}

/** Fábrica do app: `AI_PROVIDER` ('fake' | 'ai-sdk'), `AI_ESSAY_MODEL_KEY` e `AI_TIMEOUT_MS`. */
export function createEssayModel(env: EssayEnv = process.env): EssayFeedbackModel {
  const config = readEssayAiConfig(env);
  if (config.provider === "fake") {
    // Fake é o padrão por decisão do plano; em produção sem AI_PROVIDER avisa uma única vez.
    if (!env.AI_PROVIDER?.trim() && env.NODE_ENV === "production" && !warnedFakeDefault) {
      warnedFakeDefault = true;
      console.warn("[ai] AI_PROVIDER não definido: usando o modelo Fake (respostas de exemplo, sem IA real).");
    }
    return new FakeEssayModel();
  }
  const { key } = requireModelSpec(config.modelKey);
  return createAiSdkEssayModel(key, env, config.timeoutMs);
}
