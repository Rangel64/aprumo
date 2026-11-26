import { describe, expect, it } from "vitest";
import {
  assertSafeTarget,
  isReservedEmail,
  readSeedEnv,
  REMOTE_CONFIRM_VALUE,
  REMOTE_CONFIRM_VAR,
  SeedGuardError,
} from "../lib/seed-guard";
import { FAKE_ENV } from "./seed-fixtures";

const REMOTE = "https://abcdefgh.supabase.co";
const CONFIRM = { [REMOTE_CONFIRM_VAR]: REMOTE_CONFIRM_VALUE };

describe("assertSafeTarget", () => {
  it("aceita localhost e 127.0.0.1 sem flag", () => {
    expect(assertSafeTarget({ url: "http://127.0.0.1:54321", argv: [], env: {} }).local).toBe(true);
    expect(assertSafeTarget({ url: "http://localhost:54321", argv: [], env: {} }).local).toBe(true);
  });

  it("recusa remoto sem a flag, e sem a variável de confirmação", () => {
    expect(() => assertSafeTarget({ url: REMOTE, argv: [], env: CONFIRM })).toThrow(SeedGuardError);
    expect(() => assertSafeTarget({ url: REMOTE, argv: ["--allow-remote"], env: {} })).toThrow(SeedGuardError);
    expect(() =>
      assertSafeTarget({ url: REMOTE, argv: ["--allow-remote"], env: { [REMOTE_CONFIRM_VAR]: "sim" } }),
    ).toThrow(SeedGuardError);
  });

  it("recusa protocolo diferente de http/https, sem expor a URL", () => {
    for (const url of ["ftp://localhost:54321", "file:///etc/passwd", "javascript:alert(1)"]) {
      expect(() => assertSafeTarget({ url, argv: ["--allow-remote"], env: CONFIRM })).toThrow(SeedGuardError);
    }
    expect(() => assertSafeTarget({ url: "ftp://localhost:54321", argv: [], env: {} })).toThrow(/http ou https/);
  });

  it("aceita remoto com a flag E a confirmação", () => {
    const r = assertSafeTarget({ url: REMOTE, argv: ["--allow-remote"], env: CONFIRM });
    expect(r.local).toBe(false);
  });

  it("recusa sempre host com prod, mesmo com flag e confirmação, sem expor a URL", () => {
    const url = "https://aprumo-prod-xyz.supabase.co";
    let message = "";
    try {
      assertSafeTarget({ url, argv: ["--allow-remote"], env: CONFIRM });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("produção");
    expect(message).not.toContain("supabase.co");
    expect(message).not.toContain("xyz");
  });

  it("não trata host que apenas começa com localhost como local", () => {
    expect(() => assertSafeTarget({ url: "https://localhost.evil.example", argv: [], env: {} })).toThrow(
      SeedGuardError,
    );
  });

  it("recusa URL inválida sem ecoá-la", () => {
    expect(() => assertSafeTarget({ url: "nao-e-url", argv: [], env: {} })).toThrow(/não é uma URL válida/);
  });
});

describe("readSeedEnv", () => {
  it("lê as quatro variáveis", () => {
    expect(readSeedEnv(FAKE_ENV).demoEmail).toBe("demo@example.com");
  });

  it("lista só os NOMES das variáveis faltantes", () => {
    let message = "";
    try {
      readSeedEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SERVICE_ROLE_KEY: "segredo-x" });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("DEMO_USER_EMAIL");
    expect(message).toContain("DEMO_USER_PASSWORD");
    expect(message).not.toContain("segredo-x");
    expect(message).not.toContain("127.0.0.1");
  });

  it("recusa e-mail da demo fora de domínio reservado", () => {
    expect(() => readSeedEnv({ ...FAKE_ENV, DEMO_USER_EMAIL: "pessoa@gmail.com" })).toThrow(/reservado/);
  });
});

describe("isReservedEmail", () => {
  it("aceita example.* e sufixos reservados; recusa o resto", () => {
    expect(isReservedEmail("demo@example.com")).toBe(true);
    expect(isReservedEmail("DEMO@Example.org")).toBe(true);
    expect(isReservedEmail("a@aprumo.test")).toBe(true);
    expect(isReservedEmail("a@sub.example")).toBe(true);
    expect(isReservedEmail("a@notexample.com")).toBe(false);
    expect(isReservedEmail("sem-arroba")).toBe(false);
  });
});
