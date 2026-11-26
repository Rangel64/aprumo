import { afterEach, describe, expect, it, vi } from "vitest";
import { AiSdkEssayModel, DEFAULT_AI_TIMEOUT_MS } from "../ai-sdk-essay-model";
import {
  createAiSdkEssayModel,
  createEssayModel,
  PROVIDER_KEY_ENV,
  readEssayAiConfig,
  resetFakeDefaultWarningForTests,
  resolveTimeoutMs,
} from "../factory";
import { FakeEssayModel } from "../fake-essay-model";
import { computeCostUsd, ESSAY_MODEL_KEYS, ESSAY_MODELS, getEssayModelSpec } from "../models";
import { EssayModelError } from "../types";

const SYNTHETIC_KEY = "test-key-synthetic-0001";

describe("computeCostUsd", () => {
  it("é (in*preçoIn + out*preçoOut)/1e6", () => {
    // 2.000.000 * 1 + 1.000.000 * 3 = 5 (US$)
    expect(computeCostUsd({ usdPerMTokIn: 1, usdPerMTokOut: 3 }, { inputTokens: 2_000_000, outputTokens: 1_000_000 })).toBe(5);
    // 3000 * 0,10 + 1500 * 0,50 = 300 + 750 = 1050 -> 0,00105
    expect(computeCostUsd(ESSAY_MODELS["anthropic-haiku-5.5"], { inputTokens: 3000, outputTokens: 1500 })).toBeCloseTo(0.00105, 9);
    expect(computeCostUsd({ usdPerMTokIn: 1, usdPerMTokOut: 1 }, { inputTokens: 0, outputTokens: 0 })).toBe(0);
  });

  it("Gemini: tarifa muda em 2027-01-01 (0,75/3,75 -> 1,50/7,50)", () => {
    const gemini = ESSAY_MODELS["google-gemini-3.8-flash"];
    const usage = { inputTokens: 1_000_000, outputTokens: 1_000_000 };
    // 2026-12-31: 1M*0,75 + 1M*3,75 = 4,50 | 2027-01-01: 1M*1,50 + 1M*7,50 = 9,00
    expect(computeCostUsd(gemini, usage, new Date("2026-12-31T23:59:59Z"))).toBe(4.5);
    expect(computeCostUsd(gemini, usage, new Date("2027-01-01T00:00:00Z"))).toBe(9);
    expect(gemini.priceSource).toMatch(/^https:\/\//);
    expect(gemini.priceDate).toBe("2026-11-26");
  });

  it("Haiku: acima de 100 mil tokens de prompt vale a tarifa 0,50/2,50 na chamada inteira", () => {
    const haiku = ESSAY_MODELS["anthropic-haiku-5.5"];
    const at = new Date("2026-12-01T00:00:00Z");
    // 100.000 (no limite, tarifa base): 100000*0,10 + 1000*0,50 = 10000 + 500 = 10500 -> 0,0105
    expect(computeCostUsd(haiku, { inputTokens: 100_000, outputTokens: 1000 }, at)).toBeCloseTo(0.0105, 9);
    // 100.001 (faixa longa): 100001*0,50 + 1000*2,50 = 50000,5 + 2500 = 52500,5 -> 0,0525005
    expect(computeCostUsd(haiku, { inputTokens: 100_001, outputTokens: 1000 }, at)).toBeCloseTo(0.0525005, 9);
  });
});

describe("registry de modelos", () => {
  it("tem 2 candidatos de provedores diferentes, com fonte e data", () => {
    expect(ESSAY_MODEL_KEYS).toHaveLength(2);
    const providers = new Set(ESSAY_MODEL_KEYS.map((k) => ESSAY_MODELS[k].provider));
    expect(providers.size).toBe(2);
    for (const k of ESSAY_MODEL_KEYS) {
      const spec = ESSAY_MODELS[k];
      expect(spec.priceSource).toMatch(/^https:\/\//);
      expect(spec.priceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(spec.usdPerMTokIn).toBeGreaterThan(0);
      expect(spec.usdPerMTokOut).toBeGreaterThan(0);
    }
  });

  it("getEssayModelSpec devolve null para chave desconhecida (inclui chaves herdadas do Object)", () => {
    expect(getEssayModelSpec("nao-existe")).toBeNull();
    expect(getEssayModelSpec("toString")).toBeNull();
  });
});

describe("createEssayModel", () => {
  it("AI_PROVIDER ausente ou 'fake' devolve o FakeEssayModel, sem chave", () => {
    expect(createEssayModel({})).toBeInstanceOf(FakeEssayModel);
    expect(createEssayModel({ AI_PROVIDER: "fake" })).toBeInstanceOf(FakeEssayModel);
  });

  it("AI_PROVIDER inválido é recusado", () => {
    expect(() => createEssayModel({ AI_PROVIDER: "openai-direto" })).toThrow(EssayModelError);
  });

  it("ai-sdk com modelKey desconhecida falha com erro claro, listando as válidas", () => {
    const env = { AI_PROVIDER: "ai-sdk", AI_ESSAY_MODEL_KEY: "gpt-nao-existe" };
    expect(() => createEssayModel(env)).toThrow(/desconhecida/);
    expect(() => createEssayModel(env)).toThrow(ESSAY_MODEL_KEYS[0]);
    // Espaço depois de "Válidas:" e a lista sem repetir o valor digitado.
    expect(() => createEssayModel(env)).toThrow(`Válidas: ${ESSAY_MODEL_KEYS.join(", ")}.`);
    expect(() => createEssayModel(env)).not.toThrow(/gpt-nao-existe/);
  });

  it("ai-sdk sem modelKey falha com erro claro", () => {
    expect(() => createEssayModel({ AI_PROVIDER: "ai-sdk" })).toThrow(/AI_ESSAY_MODEL_KEY/);
  });

  it("ai-sdk sem a chave do provedor cita só o NOME da variável", () => {
    const env = { AI_PROVIDER: "ai-sdk", AI_ESSAY_MODEL_KEY: "anthropic-haiku-5.5" };
    expect(() => createEssayModel(env)).toThrow(PROVIDER_KEY_ENV.anthropic);
  });

  it("ai-sdk com modelKey e chave sintética cria o AiSdkEssayModel (sem rede)", () => {
    const model = createEssayModel({
      AI_PROVIDER: "ai-sdk",
      AI_ESSAY_MODEL_KEY: "anthropic-haiku-5.5",
      [PROVIDER_KEY_ENV.anthropic]: SYNTHETIC_KEY,
    });
    expect(model).toBeInstanceOf(AiSdkEssayModel);
    const google = createAiSdkEssayModel("google-gemini-3.8-flash", {
      [PROVIDER_KEY_ENV.google]: SYNTHETIC_KEY,
    });
    expect(google).toBeInstanceOf(AiSdkEssayModel);
  });

  it("timeout padrão é 45000 ms; AI_TIMEOUT_MS sobrescreve; inválido é recusado", () => {
    expect(DEFAULT_AI_TIMEOUT_MS).toBe(45_000);
    expect(resolveTimeoutMs({})).toBe(45_000);
    expect(readEssayAiConfig({}).timeoutMs).toBe(45_000);
    expect(resolveTimeoutMs({ AI_TIMEOUT_MS: "30000" })).toBe(30_000);
    expect(() => resolveTimeoutMs({ AI_TIMEOUT_MS: "abc" })).toThrow(EssayModelError);
    expect(() => resolveTimeoutMs({ AI_TIMEOUT_MS: "-5" })).toThrow(EssayModelError);
    expect(() => resolveTimeoutMs({ AI_TIMEOUT_MS: "1.5" })).toThrow(EssayModelError);
  });

  it("AI_TIMEOUT_MS aceita só inteiro em [1000, 55000]; o resto vira CONFIG claro", () => {
    expect(resolveTimeoutMs({ AI_TIMEOUT_MS: "1000" })).toBe(1000);
    expect(resolveTimeoutMs({ AI_TIMEOUT_MS: " 55000 " })).toBe(55_000);
    for (const bad of ["0", "-1", "NaN", "Infinity", "0x10", "999", "55001", "3000000000", "5e9", "99999999999999999999", "1e3"]) {
      const call = () => resolveTimeoutMs({ AI_TIMEOUT_MS: bad });
      expect(call, bad).toThrow(EssayModelError);
      expect(call, bad).toThrow(/entre 1000 e 55000/);
      expect(call, bad).not.toThrow(RangeError);
    }
  });

  it("valor de AI_ESSAY_MODEL_KEY com cara de chave de API não aparece na mensagem de erro", () => {
    const pasted = "sk-ant-api03-ABCDEFGHIJKLMNOP1234567890";
    let message = "";
    try {
      createEssayModel({ AI_PROVIDER: "ai-sdk", AI_ESSAY_MODEL_KEY: pasted });
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).toMatch(/desconhecida/);
    expect(message).not.toContain(pasted);
    expect(message).not.toContain("sk-ant");
    expect(message).toContain(ESSAY_MODEL_KEYS[0]);
  });
});

describe("aviso do padrão Fake", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetFakeDefaultWarningForTests();
  });

  it("em production sem AI_PROVIDER avisa uma única vez, sem dados sensíveis, e mantém o Fake", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resetFakeDefaultWarningForTests();
    const env = { NODE_ENV: "production", AI_ESSAY_MODEL_KEY: "sk-ant-api03-SEGREDO0123456789" };
    expect(createEssayModel(env)).toBeInstanceOf(FakeEssayModel);
    expect(createEssayModel(env)).toBeInstanceOf(FakeEssayModel);
    expect(warn).toHaveBeenCalledTimes(1);
    const text = JSON.stringify(warn.mock.calls[0]);
    expect(text).toMatch(/AI_PROVIDER/);
    expect(text).not.toMatch(/SEGREDO|sk-ant/);
  });

  it("não avisa em dev/test nem quando AI_PROVIDER=fake foi escolhido de propósito", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resetFakeDefaultWarningForTests();
    createEssayModel({});
    createEssayModel({ NODE_ENV: "development" });
    createEssayModel({ NODE_ENV: "test" });
    createEssayModel({ NODE_ENV: "production", AI_PROVIDER: "fake" });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("segredos", () => {
  const KEY_PATTERNS = [/sk-[A-Za-z0-9_-]{16,}/, /sk-ant-[A-Za-z0-9_-]{8,}/, /AIza[0-9A-Za-z_-]{20,}/, /test-key-synthetic/];

  it("nenhuma chave aparece em erros de configuração nem em logs durante a criação", () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const messages: string[] = [];
    const envs = [
      { AI_PROVIDER: "ai-sdk", AI_ESSAY_MODEL_KEY: "desconhecida", [PROVIDER_KEY_ENV.anthropic]: SYNTHETIC_KEY },
      { AI_PROVIDER: "ai-sdk", AI_ESSAY_MODEL_KEY: "google-gemini-3.8-flash" },
      { AI_PROVIDER: "ai-sdk", AI_ESSAY_MODEL_KEY: "anthropic-haiku-5.5", AI_TIMEOUT_MS: "x", [PROVIDER_KEY_ENV.anthropic]: SYNTHETIC_KEY },
    ];
    for (const env of envs) {
      try {
        createEssayModel(env);
      } catch (e) {
        messages.push(e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e));
      }
    }
    // Criação bem-sucedida também não loga nada.
    createEssayModel({
      AI_PROVIDER: "ai-sdk",
      AI_ESSAY_MODEL_KEY: "anthropic-haiku-5.5",
      [PROVIDER_KEY_ENV.anthropic]: SYNTHETIC_KEY,
    });
    const logged = spies.flatMap((s) => s.mock.calls.map((c) => JSON.stringify(c)));
    spies.forEach((s) => s.mockRestore());

    expect(messages).toHaveLength(3);
    for (const text of [...messages, ...logged]) {
      for (const p of KEY_PATTERNS) expect(text).not.toMatch(p);
    }
    expect(logged).toHaveLength(0);
  });
});
