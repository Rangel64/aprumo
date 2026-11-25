import { describe, expect, it } from "vitest";
import { evaluateMastery } from "./mastery";

describe("evaluateMastery", () => {
  it("4 de 5 com 80% passa (4*100=400 >= 80*5=400)", () => {
    expect(evaluateMastery({ correct: 4, total: 5, thresholdPct: 80 }).passed).toBe(true);
  });

  it("5 de 5 passa", () => {
    expect(evaluateMastery({ correct: 5, total: 5, thresholdPct: 80 }).passed).toBe(true);
  });

  it("3 de 5 com 80% reprova (300 < 400)", () => {
    expect(evaluateMastery({ correct: 3, total: 5, thresholdPct: 80 }).passed).toBe(false);
  });

  it("0 acertos reprova", () => {
    expect(evaluateMastery({ correct: 0, total: 5, thresholdPct: 80 }).passed).toBe(false);
  });

  it("10 questões e 70%: 7 passa (700 >= 700), 6 reprova (600 < 700), sem mudar código", () => {
    expect(evaluateMastery({ correct: 7, total: 10, thresholdPct: 70 }).passed).toBe(true);
    expect(evaluateMastery({ correct: 6, total: 10, thresholdPct: 70 }).passed).toBe(false);
  });

  it("total 0 não passa e não divide por zero", () => {
    expect(evaluateMastery({ correct: 0, total: 0, thresholdPct: 80 })).toEqual({
      correct: 0,
      total: 0,
      thresholdPct: 80,
      passed: false,
    });
    expect(evaluateMastery({ correct: 0, total: 0, thresholdPct: 0 }).passed).toBe(false);
  });

  it("limites do percentual: 100% exige todas; 1% passa com 1 de 100", () => {
    expect(evaluateMastery({ correct: 4, total: 5, thresholdPct: 100 }).passed).toBe(false);
    expect(evaluateMastery({ correct: 5, total: 5, thresholdPct: 100 }).passed).toBe(true);
    expect(evaluateMastery({ correct: 1, total: 100, thresholdPct: 1 }).passed).toBe(true);
  });

  it("devolve a entrada junto com passed", () => {
    expect(evaluateMastery({ correct: 4, total: 5, thresholdPct: 80 })).toEqual({
      correct: 4,
      total: 5,
      thresholdPct: 80,
      passed: true,
    });
  });
});
