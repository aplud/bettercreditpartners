export type Mode = "note" | "reflect" | "prompt";

export interface Followup {
  q: string;
  a: string;
}

/** The AI output shape (SPEC §5). */
export interface OrganizedEntry {
  title: string;
  summary: string;
  sections: { heading: string; points: string[] }[];
  highlights: string[];
  reflection: string | null;
  question: string | null;
}

/** Mirrors the `entries` table (SPEC §6), in camelCase on the client. */
export interface Entry {
  id: string;
  createdAt: string;
  updatedAt?: string;
  moods: string[];
  moodWord: string;
  raw: string;
  followups: Followup[];
  mode: Mode | null;
  entry: OrganizedEntry | null;
  status: "draft" | "done";
}
