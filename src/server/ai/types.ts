import type { EssayFeedbackAI, EssayPart } from "../../contracts/essay";

/**
 * Tipos do adapter de IA da redação (T17). Sem `server-only` de propósito: o eval roda sob tsx,
 * onde `import "server-only"` lança (ver `server.ts`, que é o ponto de entrada do app).
 */

export interface EssayTopicInput {
  title: string;
  motivatingText: string;
}

export interface EssayFeedbackInput {
  topic: EssayTopicInput;
  part: EssayPart;
  /** Texto do aluno. É DADO: nunca vira instrução. */
  text: string;
}

export interface EssayFeedbackOptions {
  signal?: AbortSignal;
}

export interface EssayModelUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface EssayFeedbackResult {
  output: EssayFeedbackAI;
  usage: EssayModelUsage;
  modelKey: string;
  latencyMs: number;
}

export interface EssayFeedbackModel {
  generate(input: EssayFeedbackInput, opts?: EssayFeedbackOptions): Promise<EssayFeedbackResult>;
}

export type EssayModelErrorCode =
  | "INVALID_OUTPUT" // NoObjectGeneratedError: o modelo não devolveu objeto válido pelo schema
  | "TIMEOUT" // AI_TIMEOUT_MS estourou
  | "ABORTED" // o chamador cancelou
  | "UNAVAILABLE" // erro do provedor (rede, 4xx/5xx, chave rejeitada)
  | "CONFIG"; // configuração inválida (modelKey desconhecida, chave ausente)

/**
 * Erro tipado do adapter. A mensagem é fixa por código: NUNCA inclui o texto do aluno, a resposta
 * bruta do modelo nem chave. Só metadados seguros (finishReason, usage).
 */
export class EssayModelError extends Error {
  readonly code: EssayModelErrorCode;
  readonly finishReason?: string;
  readonly usage?: EssayModelUsage;

  constructor(
    code: EssayModelErrorCode,
    message: string,
    extra: { finishReason?: string; usage?: EssayModelUsage } = {},
  ) {
    super(message);
    this.name = "EssayModelError";
    this.code = code;
    this.finishReason = extra.finishReason;
    this.usage = extra.usage;
  }
}
