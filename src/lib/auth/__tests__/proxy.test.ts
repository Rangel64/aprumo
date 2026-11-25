import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Cliente Supabase falso: getUser() dispara o setAll com cookie renovado e headers de cache.
const state = { user: null as { id: string } | null };
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    opts: {
      cookies: {
        setAll: (
          c: { name: string; value: string; options: object }[],
          h: Record<string, string>,
        ) => void;
      };
    },
  ) => ({
    auth: {
      getUser: async () => {
        opts.cookies.setAll([{ name: "sb-token", value: "novo", options: { path: "/" } }], {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        });
        return { data: { user: state.user } };
      },
    },
  }),
}));

import { proxy } from "@/proxy";

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder";
});

describe("proxy", () => {
  it("resposta normal sai com cookie renovado e Cache-Control no-store", async () => {
    state.user = { id: "u1" };
    const res = await proxy(new NextRequest("http://localhost/inicio"));
    expect(res.status).toBe(200);
    expect(res.cookies.get("sb-token")?.value).toBe("novo");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("redirect sem sessão leva cookies e Cache-Control", async () => {
    state.user = null;
    const res = await proxy(new NextRequest("http://localhost/inicio"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/entrar");
    expect(res.cookies.get("sb-token")?.value).toBe("novo");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("pragma")).toBe("no-cache");
  });

  it("/api/* não redireciona, mesmo sem sessão", async () => {
    state.user = null;
    const res = await proxy(new NextRequest("http://localhost/api/health"));
    expect(res.status).toBe(200);
  });
});
