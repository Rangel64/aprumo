import { describe, expect, it } from "vitest";
import {
  RATINGS,
  doneCount,
  nextDueText,
  progressLabel,
  ratingLabel,
  reviewAnnouncement,
  shouldFlipOnSpace,
  todayInSaoPaulo,
} from "../flashcards-state";

describe("flashcards-state", () => {
  it("rótulos dos 4 níveis", () => {
    expect(RATINGS.map((r) => [r.value, r.label])).toEqual([
      [1, "Errei"],
      [2, "Rever"],
      [3, "Quase"],
      [4, "Sabia!"],
    ]);
    expect(ratingLabel(4)).toBe("Sabia!");
  });

  it("progressLabel e doneCount", () => {
    expect(progressLabel(2, 8)).toBe("3 de 8 cartas");
    expect(progressLabel(0, 1)).toBe("1 de 1 carta");
    expect(progressLabel(8, 8)).toBe("8 de 8 cartas"); // limitado a N
    expect(doneCount(2, 8)).toBe(2);
    expect(doneCount(20, 8)).toBe(8);
  });

  it("Espaço vira a carta só fora de campos e botões", () => {
    expect(shouldFlipOnSpace(" ", { tagName: "BODY" }, false, false)).toBe(true);
    expect(shouldFlipOnSpace(" ", { tagName: "INPUT" }, false, false)).toBe(false);
    expect(shouldFlipOnSpace(" ", { tagName: "TEXTAREA" }, false, false)).toBe(false);
    expect(shouldFlipOnSpace(" ", { tagName: "BUTTON" }, false, false)).toBe(false);
    expect(shouldFlipOnSpace(" ", { tagName: "DIV", isContentEditable: true }, false, false)).toBe(false);
    expect(shouldFlipOnSpace("Enter", { tagName: "BODY" }, false, false)).toBe(false);
    expect(shouldFlipOnSpace(" ", { tagName: "BODY" }, true, false)).toBe(false); // já virada
    expect(shouldFlipOnSpace(" ", { tagName: "BODY" }, false, true)).toBe(false); // enviando
  });

  it("todayInSaoPaulo usa o fuso (02:00 UTC ainda é o dia anterior)", () => {
    expect(todayInSaoPaulo(new Date("2099-01-02T02:00:00Z"))).toBe("2099-01-01");
    expect(todayInSaoPaulo(new Date("2099-01-02T12:00:00Z"))).toBe("2099-01-02");
  });

  it("nextDueText deriva da data devolvida", () => {
    expect(nextDueText("2099-01-01", "2099-01-01")).toBe("hoje");
    expect(nextDueText("2099-01-02", "2099-01-01")).toBe("amanhã");
    expect(nextDueText("2099-01-08", "2099-01-01")).toBe("em 7 dias");
    expect(nextDueText("2099-02-01", "2099-01-31")).toBe("amanhã"); // virada de mês
    expect(nextDueText("lixo", "2099-01-01")).toBe("em breve");
  });

  it("reviewAnnouncement", () => {
    expect(reviewAnnouncement("Quase", "2099-01-05", "2099-01-01")).toBe(
      "Avaliado como Quase. Próxima revisão em 4 dias.",
    );
  });
});
