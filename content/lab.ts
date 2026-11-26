// The Lab: every component and page on ui.aryank.space, recorded. lab.json is written by
// scripts/lab (sync from the compronents registry, record, review, upload); this file types it and
// keeps only what is ready to show: reviewed as passing, with an uploaded clip.
import data from "./lab.json";

export type LabNote = { label: string; description: string };
export type LabEntry = {
  name: string;
  section: "components" | "pages";
  title: string;
  group: string;
  description: string;
  notes: LabNote[];
  status: "todo" | "pass" | "partial" | "fail";
  /** the reviewer's reading of the clip against the notes */
  check?: string;
  /** `src`/`poster` are the full 1600px clip; `tile`/`tilePoster` the 960px grid encode */
  clip?: { src: string; poster: string; tile?: string; tilePoster?: string; width: number; height: number; duration: number };
};
type Clip = NonNullable<LabEntry["clip"]>;
export type LabItem = LabEntry & { clip: Clip & Required<Pick<Clip, "tile" | "tilePoster">> };

const entries = data.entries as LabEntry[];

export const labItems: LabItem[] = entries.filter((e): e is LabItem => e.status === "pass" && !!e.clip?.tile);

/** sections in registry order, Pages first, each with its items; empty groups are dropped */
export const labGroups = data.groups
  .map((title) => ({ title, items: labItems.filter((i) => i.group === title) }))
  .filter((g) => g.items.length > 0);

export const labItem = (name: string) => labItems.find((i) => i.name === name);

/** the live page on ui.aryank.space */
export const sourceUrl = (i: Pick<LabEntry, "section" | "name">) => `https://ui.aryank.space/${i.section}/${i.name}`;

export const lab = {
  title: "Lab",
  intro: "Every component and page in our library, recorded doing what it was built to do. Open one to see the behaviour it has to get right.",
  source: "Open on ui.aryank.space",
};
