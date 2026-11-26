import type { LanguageModel } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateText, NoObjectGeneratedError } from "ai";
import { EssayFeedbackAISchema, type EssayFeedbackAI } from "../../../contracts/essay";
import { AiSdkEssayModel, MAX_OUTPUT_TOKENS } from "../ai-sdk-essay-model";
import { FakeEssayModel } from "../fake-essay-model";
import { computeCostUsd, ESSAY_MODELS } from "../models";
import { EssayModelError, type EssayFeedbackInput } from "../types";

// Só `generateText` é trocado; Output e NoObjectGeneratedError continuam os reais do pacote.
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: vi.fn() };
});

const mockedGenerate = vi.mocked(generateText);
const fakeLanguageModel = {} as LanguageModel;

const STUDENT_TEXT = "Texto secreto do Aluno Demo que jamais pode vazar em erro algum.";
const RAW_MODEL_TEXT = "RESPOSTA-BRUTA-DO-MODELO-QUE-NAO-PODE-VAZAR";
const input: EssayFeedbackInput = {
  topic: { title: "Tema de teste", motivatingText: "Texto motivador." },
  part: "development",
  text: STUDENT_TEXT,
};

async function validOutput(): Promise<EssayFeedbackAI> {
  return (await new FakeEssayModel().generate(input)).output;
}

function makeModel(overrides: { timeoutMs?: number; now?: () => number } = {}) {
  return new AiSdkEssayModel({
    modelKey: "anthropic-haiku-5.5",
    model: fakeLanguageModel,
    ...overrides,
  });
}

/** generateText que fica pendurado até o abortSignal disparar, como o SDK real. */
function hangUntilAborted() {
  mockedGenerate.mockImplementation(((opts: { abortSignal?: AbortSignal }) =>
    new Promise((_, reject) => {
      opts.abortSignal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    })) as unknown as typeof generateText);
}

beforeEach(() => {
  mockedGenerate.mockReset();
});

describe("AiSdkEssayModel", () => {
  it("sucesso: devolve output validado, usage em tokens, modelKey e latência", async () => {
    const output = await validOutput();
    mockedGenerate.mockResolvedValue({
      output,
      usage: { inputTokens: 1000, outputTokens: 2000 },
    } as unknown as Awaited<ReturnType<typeof generateText>>);
    // Relógio injetado: 1000 -> 1250 = 250 ms.
    const times = [1000, 1250];
    const result = await makeModel({ now: () => times.shift() ?? 0 }).generate(input);

    expect(EssayFeedbackAISchema.safeParse(result.output).success).toBe(true);
    expect(result.usage).toEqual({ inputTokens: 1000, outputTokens: 2000 });
    expect(result.modelKey).toBe("anthropic-haiku-5.5");
    expect(result.latencyMs).toBe(250);

    const call = mockedGenerate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.maxRetries).toBe(0);
    expect(call.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
    expect(call.abortSignal).toBeInstanceOf(AbortSignal);
    expect(call.output).toBeDefined();
    expect(String(call.prompt)).toContain(STUDENT_TEXT);
    expect(String(call.system)).not.toContain(STUDENT_TEXT);
  });

  it("usage ausente vira 0 tokens (sem NaN)", async () => {
    mockedGenerate.mockResolvedValue({
      output: await validOutput(),
      usage: {},
    } as unknown as Awaited<ReturnType<typeof generateText>>);
    const result = await makeModel().generate(input);
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it("usage inválido do provedor (NaN, negativo, Infinity, string) vira 0; válido passa intacto", async () => {
    const bad = [
      { inputTokens: Number.NaN, outputTokens: -5 },
      { inputTokens: Number.POSITIVE_INFINITY, outputTokens: Number.NEGATIVE_INFINITY },
      { inputTokens: "100", outputTokens: null },
    ];
    for (const usage of bad) {
      mockedGenerate.mockResolvedValueOnce({
        output: await validOutput(),
        usage,
      } as unknown as Awaited<ReturnType<typeof generateText>>);
      const result = await makeModel().generate(input);
      expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
    }
    // Caso válido: 7 e 0 são contagens legítimas e não podem ser zeradas por engano.
    mockedGenerate.mockResolvedValueOnce({
      output: await validOutput(),
      usage: { inputTokens: 7, outputTokens: 0 },
    } as unknown as Awaited<ReturnType<typeof generateText>>);
    const ok = await makeModel().generate(input);
    expect(ok.usage).toEqual({ inputTokens: 7, outputTokens: 0 });
  });

  it("NoObjectGeneratedError com usage inválido também não vaza NaN", async () => {
    mockedGenerate.mockRejectedValue(
      new NoObjectGeneratedError({
        message: "falha",
        text: RAW_MODEL_TEXT,
        response: { id: "r1", timestamp: new Date(0), modelId: "m" },
        usage: { inputTokens: Number.NaN, outputTokens: -1 } as never,
        finishReason: "stop",
      }),
    );
    const e = await makeModel()
      .generate(input)
      .then(
        () => null,
        (err: unknown) => err as EssayModelError,
      );
    expect(e?.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it("usage -> custo: 1000 entrada + 2000 saída no Haiku = (1000*0,10 + 2000*0,50)/1e6 = US$ 0,0011", async () => {
    mockedGenerate.mockResolvedValue({
      output: await validOutput(),
      usage: { inputTokens: 1000, outputTokens: 2000 },
    } as unknown as Awaited<ReturnType<typeof generateText>>);
    const { usage } = await makeModel().generate(input);
    expect(computeCostUsd(ESSAY_MODELS["anthropic-haiku-5.5"], usage)).toBeCloseTo(0.0011, 9);
  });

  it("NoObjectGeneratedError vira EssayModelError INVALID_OUTPUT sem vazar texto nem resposta bruta", async () => {
    mockedGenerate.mockRejectedValue(
      new NoObjectGeneratedError({
        message: `falha com ${STUDENT_TEXT}`,
        text: RAW_MODEL_TEXT,
        response: { id: "r1", timestamp: new Date(0), modelId: "m" },
        usage: { inputTokens: 10, outputTokens: 20 } as never,
        finishReason: "length",
      }),
    );
    const error = await makeModel()
      .generate(input)
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(error).toBeInstanceOf(EssayModelError);
    const e = error as EssayModelError;
    expect(e.code).toBe("INVALID_OUTPUT");
    expect(e.finishReason).toBe("length");
    expect(e.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
    const dump = JSON.stringify({ m: e.message, n: e.name, s: e.stack, c: e.cause, own: { ...e } });
    expect(dump).not.toContain(STUDENT_TEXT);
    expect(dump).not.toContain(RAW_MODEL_TEXT);
    expect(e.cause).toBeUndefined();
  });

  it("saída fora do schema (mesmo sem erro do SDK) vira INVALID_OUTPUT", async () => {
    mockedGenerate.mockResolvedValue({
      output: { competencies: [], summary: "x" },
      usage: { inputTokens: 5, outputTokens: 6 },
    } as unknown as Awaited<ReturnType<typeof generateText>>);
    await expect(makeModel().generate(input)).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
  });

  it("timeout (AI_TIMEOUT_MS) vira TIMEOUT", async () => {
    hangUntilAborted();
    // 20 ms basta: o teste espera o evento de abort, sem teto de duração (suíte em paralelo).
    await expect(makeModel({ timeoutMs: 20 }).generate(input)).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });

  it("timeout inválido no construtor vira CONFIG (nunca RangeError nem 1 ms silencioso)", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 3_000_000_000, 5e9, 55_001, 1.5]) {
      expect(() => makeModel({ timeoutMs: bad }), String(bad)).toThrow(EssayModelError);
      expect(() => makeModel({ timeoutMs: bad }), String(bad)).toThrow(/Timeout de IA inválido/);
    }
    expect(() => makeModel({ timeoutMs: 55_000 })).not.toThrow();
  });

  it("abort do chamador vira ABORTED e não TIMEOUT", async () => {
    hangUntilAborted();
    const controller = new AbortController();
    const pending = makeModel({ timeoutMs: 50_000 }).generate(input, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("erro do provedor vira UNAVAILABLE com mensagem fixa, sem vazar a mensagem original", async () => {
    mockedGenerate.mockRejectedValue(new Error(`401 invalid key test-key-123 ${STUDENT_TEXT}`));
    const error = (await makeModel()
      .generate(input)
      .catch((e: unknown) => e)) as EssayModelError;
    expect(error.code).toBe("UNAVAILABLE");
    expect(error.message).not.toContain("test-key-123");
    expect(error.message).not.toContain(STUDENT_TEXT);
  });
});
