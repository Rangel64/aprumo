/**
 * Modelos FALSOS do modo `--fake` do eval D-010 (T17): ensaiam o pipeline inteiro (adapter, prompt,
 * corpus, nota cega) sem chave, sem rede e sem custo. Latência e custo são SINTÉTICOS e
 * determinísticos: nada aqui vale para a decisão D-010.
 */
import type { EssayFeedbackAI } from "../../src/contracts/essay";
import { FakeEssayModel } from "../../src/server/ai/fake-essay-model";
import type { EssayModelSpec } from "../../src/server/ai/models";
import type {
  EssayFeedbackInput,
  EssayFeedbackModel,
  EssayFeedbackOptions,
  EssayFeedbackResult,
} from "../../src/server/ai/types";

export const FAKE_EVAL_KEYS = ["fake-a", "fake-b"] as const;
export const FAKE_BANNER = "RESULTADO FAKE — NÃO VALE PARA D-010";

/** Preços sintéticos (US$ por 1 milhão de tokens); não são de provedor algum. */
export const FAKE_EVAL_SPECS: Record<(typeof FAKE_EVAL_KEYS)[number], EssayModelSpec> = {
  "fake-a": {
    provider: "anthropic",
    modelId: "fake-a",
    usdPerMTokIn: 0.1,
    usdPerMTokOut: 0.5,
    priceSource: "sintético",
    priceDate: "2099-12-31",
  },
  "fake-b": {
    provider: "google",
    modelId: "fake-b",
    usdPerMTokIn: 0.75,
    usdPerMTokOut: 3.75,
    priceSource: "sintético",
    priceDate: "2099-12-31",
  },
};

/** Variante determinística: saída, latência e uso de tokens sintéticos que diferem entre as variantes. */
export class FakeVariantModel implements EssayFeedbackModel {
  private readonly inner = new FakeEssayModel();
  private calls = 0;

  constructor(private readonly variant: "a" | "b") {}

  async generate(input: EssayFeedbackInput, opts: EssayFeedbackOptions = {}): Promise<EssayFeedbackResult> {
    const base = await this.inner.generate(input, opts);
    this.calls += 1;
    const n = this.calls;
    if (this.variant === "a") {
      return {
        ...base,
        modelKey: "fake-a",
        latencyMs: 800 + ((n * 137) % 600),
        usage: { inputTokens: base.usage.inputTokens, outputTokens: 350 },
      };
    }
    const output: EssayFeedbackAI = {
      ...base.output,
      summary: "Orientações sintéticas da variante B: releia cada competência e ajuste você mesmo o texto.",
      competencies: base.output.competencies.map((c) => ({
        ...c,
        strengths: c.assessable ? [`${c.strengths[0] ?? ""} (variante B)`.trim()] : [],
      })),
    };
    return {
      output,
      modelKey: "fake-b",
      latencyMs: 1500 + ((n * 251) % 1800),
      usage: { inputTokens: base.usage.inputTokens + 100, outputTokens: 600 },
    };
  }
}

export function createFakeEvalModel(key: string): EssayFeedbackModel {
  if (key === "fake-a") return new FakeVariantModel("a");
  if (key === "fake-b") return new FakeVariantModel("b");
  throw new Error(`Modelo fake desconhecido: ${key}.`);
}
