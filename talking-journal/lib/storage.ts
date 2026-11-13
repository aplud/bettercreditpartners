/**
 * Storage layer. Milestone 1: localStorage only.
 * Milestone 4 swaps the internals for Supabase while keeping this interface,
 * so the UI doesn't change.
 */
import type { Entry } from "./types";

const LS_KEY = "talking-journal-entries";
const DRAFT_KEY = "talking-journal-draft";

function lsGet<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
}
function lsSet(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function lsDel(k: string) { try { localStorage.removeItem(k); } catch {} }

const byNewest = (a: Entry, b: Entry) => b.createdAt.localeCompare(a.createdAt);

export const store = {
  mode: "local" as "local" | "db",

  async list(): Promise<Entry[]> {
    return lsGet<Entry[]>(LS_KEY, []).sort(byNewest);
  },
  async save(e: Entry): Promise<Entry[]> {
    const list = lsGet<Entry[]>(LS_KEY, []).filter((x) => x.id !== e.id);
    list.push(JSON.parse(JSON.stringify(e)));
    lsSet(LS_KEY, list);
    return list.sort(byNewest);
  },
  async remove(id: string): Promise<Entry[]> {
    const list = lsGet<Entry[]>(LS_KEY, []).filter((x) => x.id !== id);
    lsSet(LS_KEY, list);
    return list.sort(byNewest);
  },

  getDraft: () => lsGet<Entry | null>(DRAFT_KEY, null),
  setDraft: (d: Entry) => lsSet(DRAFT_KEY, d),
  clearDraft: () => lsDel(DRAFT_KEY),
};
