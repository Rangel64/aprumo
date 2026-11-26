import "server-only";

/**
 * Ponto de entrada da IA da redação para o APP (rota, actions). `server-only` impede que o módulo
 * (e as chaves lidas do ambiente) vá ao bundle do cliente. O eval (tsx) importa direto de
 * `./factory`, `./models` etc., porque `import "server-only"` lança fora do Next.
 */
export { createEssayModel, createAiSdkEssayModel, readEssayAiConfig } from "./factory";
export { FakeEssayModel } from "./fake-essay-model";
export { AiSdkEssayModel } from "./ai-sdk-essay-model";
export { ESSAY_MODELS, computeCostUsd, getEssayModelSpec } from "./models";
export { essayFeedbackV1 } from "./prompts/essay-feedback.v1";
export { EssayModelError } from "./types";
export type {
  EssayFeedbackInput,
  EssayFeedbackModel,
  EssayFeedbackOptions,
  EssayFeedbackResult,
} from "./types";
