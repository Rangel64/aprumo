import { describe, expect, it } from "vitest";
import { brasiliaDayRange, isReviewedToday } from "../reviewed-today";

// 2099-06-15T02:30Z = 14/06 23:30 em Brasília (UTC-3): o dia de Brasília ainda é 14/06.
const NOW = new Date("2099-06-15T02:30:00Z");

describe("brasiliaDayRange", () => {
  it("o dia de Brasília vai de 03:00Z a 03:00Z do dia seguinte", () => {
    const { start, end } = brasiliaDayRange(NOW);
    expect(start.toISOString()).toBe("2099-06-14T03:00:00.000Z");
    expect(end.toISOString()).toBe("2099-06-15T03:00:00.000Z");
  });

  it("a partir das 03:00Z já é o dia seguinte em Brasília", () => {
    const { start } = brasiliaDayRange(new Date("2099-06-15T03:00:00Z"));
    expect(start.toISOString()).toBe("2099-06-15T03:00:00.000Z");
  });
});

describe("isReviewedToday", () => {
  it("considera o dia de Brasília, não o de UTC", () => {
    // 02:59:59Z de 15/06 ainda é 14/06 em Brasília: hoje.
    expect(isReviewedToday("2099-06-15T02:59:59Z", NOW)).toBe(true);
    // 03:00Z de 15/06 é 00:00 de 15/06 em Brasília: outro dia.
    expect(isReviewedToday("2099-06-15T03:00:00Z", NOW)).toBe(false);
  });

  it("o limite inferior (03:00Z do dia) é inclusivo e o instante anterior não conta", () => {
    expect(isReviewedToday("2099-06-14T03:00:00Z", NOW)).toBe(true);
    expect(isReviewedToday("2099-06-14T02:59:59Z", NOW)).toBe(false);
  });

  it("nulo, vazio ou inválido não conta", () => {
    expect(isReviewedToday(null, NOW)).toBe(false);
    expect(isReviewedToday(undefined, NOW)).toBe(false);
    expect(isReviewedToday("", NOW)).toBe(false);
    expect(isReviewedToday("não é data", NOW)).toBe(false);
  });
});
