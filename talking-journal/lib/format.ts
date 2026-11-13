import type { Entry } from "./types";

export function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString(undefined, opts || { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function dayKey(d: string | Date) {
  const x = new Date(d);
  return x.getFullYear() + "-" + (x.getMonth() + 1) + "-" + x.getDate();
}
/** Consecutive local-time days with at least one entry, counting back from today (or yesterday). */
export function streak(entries: Entry[]) {
  const days = new Set(entries.map((e) => dayKey(e.createdAt)));
  let n = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function entryAsText(e: Entry) {
  const en = e.entry;
  const lines: string[] = [fmtDate(e.createdAt), en?.title || "", (e.moods || []).join(", ") + (e.moodWord ? ` (${e.moodWord})` : ""), "", en?.summary || "", ""];
  (en?.sections || []).forEach((s) => { lines.push(s.heading); (s.points || []).forEach((p) => lines.push("• " + p)); lines.push(""); });
  if (en?.highlights?.length) { lines.push("Good moments"); en.highlights.forEach((h) => lines.push("• " + h)); lines.push(""); }
  if (en?.reflection) lines.push("What I heard", en.reflection);
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}

/** UUID (matches the Postgres `uuid` id column). Falls back when not in a secure context. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
}
