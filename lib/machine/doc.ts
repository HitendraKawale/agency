// The machine view's page model, after basement's (basement.studio/ai/home, pinned in
// reference/basement-machine). Each page is one Doc. components/machine renders it as HTML at
// /ai/<path>, and lib/machine/markdown.ts prints it as /<path>.md, so the two can't disagree.

/** A run of text: plain, dim, a link out, or a link to another machine page. */
export type Span =
  | string
  | { dim: string }
  | { text: string; href: string }
  | { text: string; page: string; hash?: string };

export type Line = readonly Span[];

/** `name .......... value` */
export type Row = { key: string; value: Line };

/** `* title`, its paragraphs, then `[tag] [tag]` */
export type Item = { id?: string; title: Line; body: readonly Line[]; tags?: readonly string[] };

export type Block =
  | { kind: "text"; lines: readonly Line[] }
  | { kind: "rows"; rows: readonly Row[] }
  /** `- ` lines */
  | { kind: "list"; lines: readonly Line[] }
  | { kind: "items"; items: readonly Item[] };

/** `── NAME ────` and what sits under it */
export type Section = { name: string; blocks: readonly Block[] };

export type Doc = {
  /** the page under /ai: "home", "services", "showcase/relay" */
  path: string;
  title: string;
  /** the `# ...` line under the title */
  note?: string;
  /** rows under the title; the markdown and human links are added after them */
  meta?: readonly Row[];
  /** basement sets the whole home and showcase index in capitals, other pages only the header */
  upper: boolean;
  sections: readonly Section[];
  head: { title: string; description: string };
};

/** where a Doc lives in each form */
export const urls = (path: string) => ({
  ai: `/ai/${path}`,
  md: path === "home" ? "/index.md" : `/${path}.md`,
  human: path === "home" ? "/" : `/${path}`,
});
