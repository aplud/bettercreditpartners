/**
 * Milestone 1 placeholder organizer, so the whole flow works with no AI and no accounts.
 * Milestone 3 replaces this with POST /api/entries/:id/organize (Claude + zod).
 */
import type { Entry, Mode, OrganizedEntry } from "./types";

function sentences(text: string) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export async function organize(d: Entry, mode: Mode): Promise<OrganizedEntry> {
  await new Promise((r) => setTimeout(r, 900));
  const said = sentences(d.raw);
  const first = (said[0] || d.raw).replace(/[.,!?;:]+$/, "").split(/\s+/);
  const words = first.slice(0, 6).join(" ") + (first.length > 6 ? "…" : "");
  const sections = [{ heading: "What I said", points: said.length ? said : [d.raw.trim()] }];
  const answers = d.followups.filter((f) => f.a).flatMap((f) => sentences(f.a));
  if (answers.length) sections.push({ heading: "Going deeper", points: answers });
  return {
    title: words ? words.charAt(0).toUpperCase() + words.slice(1) : "Today",
    summary: said[0] || "",
    sections,
    highlights: [],
    reflection: mode === "reflect" ? "This is where a few warm lines reflecting on your day will go once the AI is connected." : null,
    question: mode === "prompt" ? "What feels most unfinished about today?" : null,
  };
}
