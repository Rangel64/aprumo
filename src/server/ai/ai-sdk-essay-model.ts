/**
 * Adapter do AI SDK para o retorno da redação (T17, D-010).
 *
 * Fonte da API confirmada no pacote INSTALADO `ai@7.0.181` (node_modules/ai, package.json):
 *  - docs/07-reference/01-ai-sdk-core/01-generate-text.mdx: `generateText({ model, system, prompt,
 *    output, abortSignal, maxRetries, maxOutputTokens })`; o resultado traz `output` e `usage`.
 *  - docs/07-reference/01-ai-sdk-core/28-output.mdx: `Output.object({ schema })` (schema zod).
 *  - docs/07-reference/05-ai-sdk-errors/ai-no-object-generated-error.mdx e dist/index-*.d.ts:
 *    `NoObjectGeneratedError.isInstance(e)`, com `text` (resposta bruta, que NÃO usamos),
 *    `finishReason` e `usage`.
 *  - dist/index-*.d.ts `LanguageModelUsage`: `inputTokens` e `outputTokens` (number | undefined).
 *
 * Sem `server-only` de propósito: o eval roda sob tsx, onde esse import lança (ver `server.ts`).
 * Nunca loga nem propaga o texto do aluno, a resposta bruta do modelo ou chaves.
 */
import { generateText, NoObjectGeneratedError, Output, type LanguageModel } from "ai";
import { EssayFeedbackAISchema } from "../../contracts/essay";
import { essayFeedbackV1, type EssayPrompt } from "./prompts/essay-feedback.v1";
import {
  EssayModelError,
  type EssayFeedbackInput,
  type EssayFeedbackModel,
  type EssayFeedbackOptions,
  type EssayFeedbackResult,
  type EssayModelUsage,
} from "./types";

export const DEFAULT_AI_TIMEOUT_MS = 45_000;
/** Faixa válida do timeout: a rota tem maxDuration de 60 s, então o teto deixa folga (55 s). */
export const MIN_AI_TIMEOUT_MS = 1_000;
export const MAX_AI_TIMEOUT_MS = 55_000;

/**
 * Valida o timeout (inteiro finito em [1000, 55000]); inválido vira EssayModelError CONFIG (nunca
 * RangeError do AbortSignal.timeout nem timeout de 1 ms). `minMs` é baixado só pelo construtor,
 * para testes com timeout curto; env e fábrica usam o mínimo de 1000.
 */
export function assertValidTimeoutMs(value: number, minMs: number = MIN_AI_TIMEOUT_MS): number {
  if (!Number.isInteger(value) || value < minMs || value > MAX_AI_TIMEOUT_MS) {
    throw new EssayModelError(
      "CONFIG",
      `Timeout de IA inválido: use um inteiro entre ${MIN_AI_TIMEOUT_MS} e ${MAX_AI_TIMEOUT_MS} ms.`,
    );
  }
  return value;
}
/** Teto de tokens de saída por chamada (contenção de custo; inclui raciocínio nos modelos que o têm). */
export const MAX_OUTPUT_TOKENS = 4096;

export interface AiSdkEssayModelConfig {
  modelKey: string;
  model: LanguageModel;
  timeoutMs?: number;
  prompt?: EssayPrompt;
  /** Relógio injetável (testes). */
  now?: () => number;
}

/** Contagem vinda do provedor: só número finito e não negativo; qualquer outra coisa vira 0. */
function safeTokenCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function toUsage(
  usage: { inputTokens?: number | undefined; outputTokens?: number | undefined } | undefined,
): EssayModelUsage {
  return {
    inputTokens: safeTokenCount(usage?.inputTokens),
    outputTokens: safeTokenCount(usage?.outputTokens),
  };
}

function isAbortLike(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError" || error.name === "ResponseAborted")
  );
}

export class AiSdkEssayModel implements EssayFeedbackModel {
  private readonly modelKey: string;
  private readonly model: LanguageModel;
  private readonly timeoutMs: number;
  private readonly prompt: EssayPrompt;
  private readonly now: () => number;

  constructor(config: AiSdkEssayModelConfig) {
    this.modelKey = config.modelKey;
    this.model = config.model;
    this.timeoutMs = assertValidTimeoutMs(config.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS, 1);
    this.prompt = config.prompt ?? essayFeedbackV1;
    this.now = config.now ?? (() => performance.now());
  }

  async generate(
    input: EssayFeedbackInput,
    opts: EssayFeedbackOptions = {},
  ): Promise<EssayFeedbackResult> {
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = opts.signal ? AbortSignal.any([timeoutSignal, opts.signal]) : timeoutSignal;
    const start = this.now();

    try {
      const result = await generateText({
        model: this.model,
        system: this.prompt.system,
        prompt: this.prompt.buildUser(input),
        output: Output.object({ schema: EssayFeedbackAISchema }),
        abortSignal: signal,
        // Sem retentativa interna: a rota decide a nova tentativa dentro do orçamento de tempo.
        maxRetries: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });

      const parsed = EssayFeedbackAISchema.safeParse(result.output);
      if (!parsed.success) {
        throw new EssayModelError("INVALID_OUTPUT", "O modelo não devolveu um retorno válido.", {
          usage: toUsage(result.usage),
        });
      }
      return {
        output: parsed.data,
        usage: toUsage(result.usage),
        modelKey: this.modelKey,
        latencyMs: Math.max(0, Math.round(this.now() - start)),
      };
    } catch (error) {
      throw this.mapError(error, timeoutSignal, opts.signal);
    }
  }

  /** Erro tipado com mensagem fixa: sem texto do aluno, sem resposta bruta, sem causa do provedor. */
  private mapError(
    error: unknown,
    timeoutSignal: AbortSignal,
    callerSignal?: AbortSignal,
  ): EssayModelError {
    if (error instanceof EssayModelError) return error;
    if (NoObjectGeneratedError.isInstance(error)) {
      return new EssayModelError("INVALID_OUTPUT", "O modelo não devolveu um retorno válido.", {
        finishReason: error.finishReason,
        usage: toUsage(error.usage),
      });
    }
    if (timeoutSignal.aborted) {
      return new EssayModelError("TIMEOUT", "O modelo demorou mais que o tempo limite.");
    }
    if (callerSignal?.aborted || isAbortLike(error)) {
      return new EssayModelError("ABORTED", "A chamada ao modelo foi cancelada.");
    }
    return new EssayModelError("UNAVAILABLE", "O provedor de IA está indisponível no momento.");
  }
}
