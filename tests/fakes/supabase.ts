// A fake of the slice of the Supabase client the content repo uses: an in-memory table per name,
// the query-builder chain (select / eq / in / order / maybeSingle / single / upsert / insert / delete),
// and rpc(). It records what was asked so tests can assert on the shape of a query, not only its result.

type Row = Record<string, unknown>;
type Filter = [string, unknown];
type Query = {
  table: string;
  op: 'select' | 'upsert' | 'insert' | 'delete';
  values: Row[] | null;
  onConflict: string | null;
  filters: Filter[];
  ins: [string, unknown[]][];
  columns: string;
  shape: 'many' | 'maybe' | 'single';
};

let nextId = 1;
const newId = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;

export function fakeSupabase(seed: Record<string, Row[]> = {}) {
  const tables = new Map<string, Row[]>(Object.entries(seed).map(([name, rows]) => [name, rows.map((row) => ({ ...row }))]));
  const selects: Record<string, string[]> = {};
  const upsertConflicts: Record<string, string[]> = {};
  const rpcs: { name: string; args: unknown }[] = [];

  const rowsOf = (table: string) => {
    if (!tables.has(table)) tables.set(table, []);
    return tables.get(table)!;
  };
  const matches = (row: Row, q: Query) =>
    q.filters.every(([column, value]) => row[column] === value) && q.ins.every(([column, values]) => values.includes(row[column]));

  function run(q: Query) {
    const rows = rowsOf(q.table);
    if (q.op === 'select') {
      const found = rows.filter((row) => matches(row, q));
      if (q.shape === 'maybe') return { data: found[0] ?? null, error: null };
      if (q.shape === 'single') return found.length === 1 ? { data: found[0], error: null } : { data: null, error: { message: `expected one row, got ${found.length}` } };
      return { data: found, error: null };
    }
    if (q.op === 'delete') {
      tables.set(q.table, rows.filter((row) => !matches(row, q)));
      return { data: null, error: null };
    }
    const written: Row[] = [];
    for (const value of q.values ?? []) {
      const keys = q.op === 'upsert' ? (q.onConflict ?? 'id').split(',').map((k) => k.trim()) : [];
      const existing = keys.length && keys.every((k) => value[k] !== undefined) ? rows.find((row) => keys.every((k) => row[k] === value[k])) : undefined;
      if (existing) {
        Object.assign(existing, value);
        written.push(existing);
      } else {
        const row = { id: newId(), ...value };
        rows.push(row);
        written.push(row);
      }
    }
    if (q.shape === 'single') return { data: written[0], error: null };
    if (q.shape === 'maybe') return { data: written[0] ?? null, error: null };
    return { data: written, error: null };
  }

  function builder(table: string) {
    const q: Query = { table, op: 'select', values: null, onConflict: null, filters: [], ins: [], columns: '*', shape: 'many' };
    const api = {
      select(columns = '*') { if (q.op === 'select') { q.columns = columns; (selects[table] ??= []).push(columns); } return api; },
      eq(column: string, value: unknown) { q.filters.push([column, value]); return api; },
      in(column: string, values: unknown[]) { q.ins.push([column, values]); return api; },
      order() { return api; },
      maybeSingle() { q.shape = 'maybe'; return api; },
      single() { q.shape = 'single'; return api; },
      upsert(values: Row | Row[], options?: { onConflict?: string }) { q.op = 'upsert'; q.values = Array.isArray(values) ? values : [values]; q.onConflict = options?.onConflict ?? null; (upsertConflicts[table] ??= []).push(q.onConflict ?? 'id'); return api; },
      insert(values: Row | Row[]) { q.op = 'insert'; q.values = Array.isArray(values) ? values : [values]; return api; },
      delete() { q.op = 'delete'; return api; },
      then<T>(resolve: (value: ReturnType<typeof run>) => T, reject?: (reason: unknown) => T) { return Promise.resolve().then(() => run(q)).then(resolve, reject); },
    };
    return api;
  }

  // The transactional save (Batch 4's database function), modelled as: update by id when given, else
  // upsert on the natural key; relations are replaced wholesale. Returns the parent row.
  function saveContentItem(payload: Row) {
    const { tags = [], images = [], links = [], ...item } = payload as Row & { tags?: string[]; images?: Row[]; links?: Row[] };
    const rows = rowsOf('content_items');
    const byId = item.id ? rows.find((row) => row.id === item.id) : undefined;
    const byKey = byId ?? rows.find((row) => row.content_type === item.content_type && row.locale === item.locale && row.slug === item.slug);
    let row: Row;
    if (byKey) { Object.assign(byKey, item); row = byKey; } else { row = { id: newId(), ...item }; rows.push(row); }
    tables.set('content_item_tags', rowsOf('content_item_tags').filter((r) => r.content_item_id !== row.id).concat(tags.map((name) => ({ content_item_id: row.id, tag: name }))));
    tables.set('gallery_images', rowsOf('gallery_images').filter((r) => r.content_item_id !== row.id).concat(images.map((image) => ({ content_item_id: row.id, ...image }))));
    tables.set('project_links', rowsOf('project_links').filter((r) => r.content_item_id !== row.id).concat(links.map((link) => ({ content_item_id: row.id, ...link }))));
    return row;
  }

  const client = {
    from: (table: string) => builder(table),
    rpc(name: string, args: Record<string, unknown> = {}) {
      rpcs.push({ name, args });
      if (name === 'save_content_item') return Promise.resolve({ data: saveContentItem(args.payload as Row), error: null });
      return Promise.resolve({ data: null, error: { message: `unknown function ${name}` } });
    },
  };

  return {
    client,
    rows: (table: string) => rowsOf(table),
    selects: (table: string) => selects[table] ?? [],
    upsertConflicts: (table: string) => upsertConflicts[table] ?? [],
    rpcCalls: (name: string) => rpcs.filter((call) => call.name === name),
  };
}
