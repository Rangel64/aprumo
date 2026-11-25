import { describe, expect, it } from "vitest";
import { brasiliaDateString, nextDueOn, type FlashcardIntervals } from "./flashcard-scheduler";

// Fixture de teste (o código de produção não tem intervalos fixos).
const INTERVALS: FlashcardIntervals = { "1": 1, "2": 2, "3": 4, "4": 7 };
const NOON = new Date("2099-03-10T15:00:00Z"); // 12h em Brasília, dia 10

describe("nextDueOn", () => {
  it.each([
    [1, "2099-03-11"], // 10 + 1
    [2, "2099-03-12"], // 10 + 2
    [3, "2099-03-14"], // 10 + 4
    [4, "2099-03-17"], // 10 + 7
  ] as const)("rating %i", (rating, expected) => {
    expect(nextDueOn(rating, NOON, INTERVALS)).toBe(expected);
  });

  it("usa outros intervalos recebidos", () => {
    const custom: FlashcardIntervals = { "1": 0, "2": 3, "3": 10, "4": 30 };
    expect(nextDueOn(1, NOON, custom)).toBe("2099-03-10"); // 10 + 0
    expect(nextDueOn(2, NOON, custom)).toBe("2099-03-13");
    expect(nextDueOn(3, NOON, custom)).toBe("2099-03-20");
    expect(nextDueOn(4, NOON, custom)).toBe("2099-04-09"); // 10 + 30 = 40 -> 9 abr (mar tem 31)
  });

  it("vira o mês", () => {
    expect(nextDueOn(4, new Date("2099-01-28T15:00:00Z"), INTERVALS)).toBe("2099-02-04"); // 28 + 7
  });

  it("vira o ano", () => {
    expect(nextDueOn(3, new Date("2099-12-30T15:00:00Z"), INTERVALS)).toBe("2100-01-03"); // 30 + 4
  });

  it("fev bissexto", () => {
    expect(nextDueOn(1, new Date("2096-02-28T15:00:00Z"), INTERVALS)).toBe("2096-02-29");
    expect(nextDueOn(2, new Date("2096-02-28T15:00:00Z"), INTERVALS)).toBe("2096-03-01");
  });

  it("fuso: 23h30 de Brasília ainda é o dia local, não o dia UTC", () => {
    // 2099-03-10T23:30-03:00 = 2099-03-11T02:30Z. Dia de Brasília = 10.
    const late = new Date("2099-03-11T02:30:00Z");
    expect(brasiliaDateString(late)).toBe("2099-03-10");
    expect(nextDueOn(1, late, INTERVALS)).toBe("2099-03-11"); // 10 + 1 (UTC daria dia 12)
  });

  it("fuso: 00h30 de Brasília já é o dia seguinte", () => {
    // 2099-03-11T00:30-03:00 = 03:30Z.
    expect(brasiliaDateString(new Date("2099-03-11T03:30:00Z"))).toBe("2099-03-11");
    // Um minuto antes da meia-noite local (02:59Z) ainda é dia 10.
    expect(brasiliaDateString(new Date("2099-03-11T02:59:00Z"))).toBe("2099-03-10");
  });

  it("virada de ano pelo fuso: 31/12 23h30 em Brasília", () => {
    const late = new Date("2100-01-01T02:30:00Z");
    expect(brasiliaDateString(late)).toBe("2099-12-31");
    expect(nextDueOn(1, late, INTERVALS)).toBe("2100-01-01");
  });
});
