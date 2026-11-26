/**
 * Banco em memória mínimo para testar o seed sem rede (mock do supabase-js).
 * Cobre só o que o seed usa: upsert (com onConflict), insert, delete().eq(), select com
 * eq/in/order/limit/single, rpc e auth.admin. Chaves e e-mails aqui são fictícios.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;
interface Result {
  data: unknown;
  error: { message: string } | null;
}

export interface FakeCall {
  table: string;
  op: "upsert" | "insert" | "delete" | "select";
}

export class FakeDb {
  tables = new Map<string, Map<string, Row>>();
  calls: FakeCall[] = [];
  rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
  authCalls: string[] = [];
  users: { id: string; email: string }[] = [];
  private seq = 0;

  table(name: string): Row[] {
    return [...(this.tables.get(name)?.values() ?? [])];
  }

  count(name: string): number {
    return this.tables.get(name)?.size ?? 0;
  }

  /** Lê só os writes (upsert/insert/delete) para provar que nada foi escrito. */
  get writes(): FakeCall[] {
    return this.calls.filter((c) => c.op !== "select");
  }

  seed(name: string, rows: Row[]): void {
    const t = this.tables.get(name) ?? new Map<string, Row>();
    for (const r of rows) t.set(`seed-${this.seq++}`, { ...r });
    this.tables.set(name, t);
  }

  nextId(table: string): string {
    return `${table}-id-${++this.seq}`;
  }

  from(table: string): Builder {
    return new Builder(this, table);
  }

  client(): SupabaseClient {
    return makeClient(this);
  }
}

function makeClient(db: FakeDb): SupabaseClient {
  return {
      from: (t: string) => db.from(t),
      rpc: (name: string, args: Record<string, unknown>) => {
        db.rpcCalls.push({ name, args });
        const n = Array.isArray(args.p_essays) ? args.p_essays.length : 0;
        return Promise.resolve({ data: n, error: null });
      },
      auth: {
        admin: {
          createUser: (a: { email: string }) => {
            db.authCalls.push("createUser");
            if (db.users.some((u) => u.email === a.email)) {
              return Promise.resolve({ data: { user: null }, error: { message: "already registered" } });
            }
            const user = { id: "demo-user-id", email: a.email };
            db.users.push(user);
            return Promise.resolve({ data: { user }, error: null });
          },
          listUsers: () => {
            db.authCalls.push("listUsers");
            return Promise.resolve({ data: { users: db.users }, error: null });
          },
          updateUserById: () => {
            db.authCalls.push("updateUserById");
            return Promise.resolve({ data: { user: db.users[0] }, error: null });
          },
        },
      },
  } as unknown as SupabaseClient;
}

class Builder implements PromiseLike<Result> {
  private op: FakeCall["op"] = "select";
  private rows: Row[] = [];
  private conflict: string[] | null = null;
  private filters: ((r: Row) => boolean)[] = [];
  private orderBy: string | null = null;
  private max: number | null = null;
  private wantsSingle = false;
  private returning = false;

  constructor(
    private db: FakeDb,
    private table: string,
  ) {}

  select(): this {
    this.returning = true;
    return this;
  }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }): this {
    this.op = "upsert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    this.conflict = opts?.onConflict?.split(",").map((s) => s.trim()) ?? null;
    return this;
  }
  insert(rows: Row | Row[]): this {
    this.op = "insert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown): this {
    this.filters.push((r) => r[col] === val);
    return this;
  }
  in(col: string, vals: unknown[]): this {
    this.filters.push((r) => vals.includes(r[col]));
    return this;
  }
  order(col: string): this {
    this.orderBy = col;
    return this;
  }
  limit(n: number): this {
    this.max = n;
    return this;
  }
  single(): this {
    this.wantsSingle = true;
    return this;
  }

  private run(): Result {
    this.db.calls.push({ table: this.table, op: this.op });
    const t = this.db.tables.get(this.table) ?? new Map<string, Row>();
    this.db.tables.set(this.table, t);
    let out: Row[] = [];

    if (this.op === "upsert" || this.op === "insert") {
      for (const row of this.rows) {
        let key: string | null = null;
        if (this.op === "upsert" && this.conflict) {
          key = this.conflict.map((c) => String(row[c])).join("|");
        }
        const existing = key !== null ? t.get(key) : undefined;
        if (existing) {
          Object.assign(existing, row);
          out.push(existing);
        } else {
          const full = { id: this.db.nextId(this.table), ...row };
          t.set(key ?? `row-${this.db.nextId("k")}`, full);
          out.push(full);
        }
      }
    } else if (this.op === "delete") {
      for (const [k, r] of [...t.entries()]) {
        if (!this.filters.every((f) => f(r))) continue;
        t.delete(k);
        // ON DELETE CASCADE de journeys -> journey_contents / schedule_sessions.
        if (this.table === "journeys") {
          for (const child of ["journey_contents", "schedule_sessions"]) {
            const ct = this.db.tables.get(child);
            for (const [ck, cr] of [...(ct?.entries() ?? [])]) {
              if (cr.journey_id === r.id) ct!.delete(ck);
            }
          }
        }
      }
    } else {
      out = [...t.values()].filter((r) => this.filters.every((f) => f(r)));
      const ob = this.orderBy;
      if (ob) out.sort((a, b) => Number(a[ob] ?? 0) - Number(b[ob] ?? 0) || String(a[ob]).localeCompare(String(b[ob])));
      if (this.max !== null) out = out.slice(0, this.max);
    }

    if (this.op === "delete" || (this.op !== "select" && !this.returning)) {
      return { data: null, error: null };
    }
    return { data: this.wantsSingle ? (out[0] ?? null) : out, error: null };
  }

  then<R1 = Result, R2 = never>(
    onfulfilled?: ((value: Result) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}
