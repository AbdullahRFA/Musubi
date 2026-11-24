/**
 * Minimal in-memory stand-in for the Supabase client: every query is recorded
 * and resolves to { data, error }. Tests can override results per query.
 */
export interface Query {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete" | "rpc";
  payload?: any;
  filters: any[][];
  returning?: boolean;
}

type Handler = (q: Query) => { data?: any; error?: any } | undefined;

export function makeFakeSupabase(handler?: Handler) {
  const calls: Query[] = [];
  const resolve = (q: Query) => {
    calls.push(q);
    const custom = handler?.(q);
    if (custom) return { data: custom.data ?? null, error: custom.error ?? null };
    if ((q.op === "insert" || q.op === "upsert") && q.returning) {
      const row = Array.isArray(q.payload) ? q.payload[0] : q.payload;
      return { data: { id: row?.id ?? `srv-${calls.length}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...row }, error: null };
    }
    return { data: q.op === "select" ? [] : null, error: null };
  };
  const builder = (q: Query) => {
    const b: any = {};
    for (const m of ["eq", "neq", "in", "or", "order", "limit", "match", "is", "gte", "lte"]) b[m] = (...a: any[]) => (q.filters.push([m, ...a]), b);
    b.select = () => {
      if (q.op !== "select") q.returning = true;
      return b;
    };
    b.single = b.maybeSingle = () => b;
    for (const op of ["insert", "update", "upsert", "delete"] as const)
      b[op] = (payload?: any) => {
        q.op = op;
        q.payload = payload;
        return b;
      };
    b.then = (res: any, rej: any) => Promise.resolve(resolve(q)).then(res, rej);
    return b;
  };
  const channel: any = { on: () => channel, subscribe: () => channel };
  const client = {
    calls,
    from: (table: string) => builder({ table, op: "select", filters: [] }),
    rpc: (name: string, args: any) => Promise.resolve(resolve({ table: name, op: "rpc", payload: args, filters: [] })),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: "https://signed" }, error: null }),
      }),
    },
    auth: { getUser: async () => ({ data: { user: null } }) },
    channel: () => channel,
    removeChannel: () => {},
  };
  return client;
}

export const opsOn = (client: { calls: Query[] }, table: string, op?: Query["op"]) =>
  client.calls.filter((c) => c.table === table && (!op || c.op === op));
