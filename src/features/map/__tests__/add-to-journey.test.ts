import { describe, expect, it } from "vitest";
import { fail, ok } from "@/contracts/errors";
import { ADD_MESSAGES, decideAddToJourney } from "../add-to-journey";

const J = "11111111-1111-4111-8111-111111111111";

describe("decideAddToJourney", () => {
  it("added > 0: mensagem de adicionado", () => {
    expect(decideAddToJourney(ok({ journeyId: J, added: 1 }), "x")).toEqual({
      kind: "added",
      message: "Adicionado à sua Jornada",
    });
  });

  it("added = 0: já está na Jornada", () => {
    expect(decideAddToJourney(ok({ journeyId: J, added: 0 }), "x")).toEqual({
      kind: "already",
      message: "Já está na sua Jornada",
    });
  });

  it("NO_ACTIVE_JOURNEY: redireciona para /jornada/nova com o slug", () => {
    const out = decideAddToJourney(fail("NO_ACTIVE_JOURNEY", "sem jornada"), "fracoes");
    expect(out.kind).toBe("redirect");
    expect(out).toMatchObject({ href: expect.stringContaining("/jornada/nova") });
    expect(out).toMatchObject({ href: expect.stringContaining("fracoes") });
  });

  it.each(["INTERNAL", "UNAUTHENTICATED", "NOT_FOUND", "VALIDATION"] as const)(
    "%s: alerta genérico, sem vazar a mensagem original",
    (code) => {
      const out = decideAddToJourney(fail(code, "detalhe interno secreto"), "x");
      expect(out).toEqual({ kind: "error", message: ADD_MESSAGES.error });
    },
  );
});
