import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "../safe-url";

describe("safeHttpUrl", () => {
  it("aceita https válida e devolve a URL normalizada", () => {
    expect(safeHttpUrl("https://example.com/fonte")).toBe("https://example.com/fonte");
  });

  it("aceita http", () => {
    expect(safeHttpUrl("http://example.com/fonte")).toBe("http://example.com/fonte");
  });

  it("rejeita javascript:", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("JAVASCRIPT:alert(1)")).toBeNull();
  });

  it("rejeita data:", () => {
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejeita URL inválida, texto solto e vazio", () => {
    expect(safeHttpUrl("não é uma url")).toBeNull();
    expect(safeHttpUrl("example.com/fonte")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });
});
