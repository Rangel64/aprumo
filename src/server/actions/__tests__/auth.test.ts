import { describe, expect, it, vi } from "vitest";

// As actions tocam o Supabase só depois da validação; aqui só se testa a validação (sem rede).
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    throw new Error("não deve ser chamado quando a entrada é inválida");
  },
}));

import { AuthInputSchema } from "@/contracts/actions";
import { signIn, signUp } from "../auth";

describe("AuthInputSchema", () => {
  it("normaliza o e-mail (trim e minúsculas)", () => {
    const r = AuthInputSchema.parse({ email: "  Ana@Example.COM ", password: "123456" });
    expect(r.email).toBe("ana@example.com");
  });

  it("aceita senha com exatamente 6 e 72 caracteres", () => {
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "a".repeat(6) }).success).toBe(true);
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "a".repeat(72) }).success).toBe(true);
  });

  it("rejeita senha com 5 e com 73 caracteres", () => {
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "a".repeat(5) }).success).toBe(false);
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "a".repeat(73) }).success).toBe(false);
  });

  it("limita a senha a 72 bytes: 36 'é' (72 bytes) passa, 37 (74 bytes) não", () => {
    // "é" ocupa 2 bytes em UTF-8: 36 x 2 = 72; 37 x 2 = 74.
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "é".repeat(36) }).success).toBe(true);
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "é".repeat(37) }).success).toBe(false);
  });

  it("rejeita e-mail inválido e nome vazio ou maior que 80", () => {
    expect(AuthInputSchema.safeParse({ email: "sem-arroba", password: "123456" }).success).toBe(false);
    expect(AuthInputSchema.safeParse({ email: "a@example.com", password: "123456", displayName: "   " }).success).toBe(false);
    expect(
      AuthInputSchema.safeParse({ email: "a@example.com", password: "123456", displayName: "n".repeat(81) }).success,
    ).toBe(false);
  });
});

describe("actions de auth: validação", () => {
  it("signUp com e-mail inválido devolve VALIDATION no campo email", async () => {
    const r = await signUp({ email: "x", password: "123456" });
    expect(r).toEqual({
      ok: false,
      error: { code: "VALIDATION", message: "Informe um e-mail válido.", field: "email" },
    });
  });

  it("signIn com senha curta devolve VALIDATION no campo password", async () => {
    const r = await signIn({ email: "a@example.com", password: "123" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("VALIDATION");
      expect(r.error.field).toBe("password");
    }
  });
});
