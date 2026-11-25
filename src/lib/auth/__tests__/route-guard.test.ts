import { describe, expect, it } from "vitest";
import { getRedirectTarget } from "../route-guard";

describe("getRedirectTarget", () => {
  const protectedPaths = [
    "/inicio",
    "/mapa",
    "/trilhas/enem-matematica",
    "/jornada",
    "/jornada/nova",
    "/conteudos/funcao-afim",
    "/conteudos/funcao-afim/mini-simulado",
    "/revisar",
    "/cronograma",
    "/redacao",
    "/redacao/abc",
  ];

  it.each(protectedPaths)("sem sessão, %s vai a /entrar", (path) => {
    expect(getRedirectTarget(path, false)).toBe("/entrar");
  });

  it.each(protectedPaths)("com sessão, %s segue", (path) => {
    expect(getRedirectTarget(path, true)).toBeNull();
  });

  it.each(["/", "/entrar", "/cadastro"])("sem sessão, %s é aberta", (path) => {
    expect(getRedirectTarget(path, false)).toBeNull();
  });

  it.each(["/entrar", "/cadastro"])("com sessão, %s vai a /inicio", (path) => {
    expect(getRedirectTarget(path, true)).toBe("/inicio");
  });

  it("com sessão, a Entrada segue aberta", () => {
    expect(getRedirectTarget("/", true)).toBeNull();
  });

  it.each([true, false])("/api/* nunca redireciona (sessão=%s)", (auth) => {
    expect(getRedirectTarget("/api/health", auth)).toBeNull();
    expect(getRedirectTarget("/api/essays/feedback", auth)).toBeNull();
  });

  it("não confunde prefixos parecidos", () => {
    // "/iniciox" e "/mapas" não são as rotas protegidas.
    expect(getRedirectTarget("/iniciox", false)).toBeNull();
    expect(getRedirectTarget("/mapas", false)).toBeNull();
  });
});
