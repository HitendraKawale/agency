// The markdown twins. proxy.ts sends /<path>.md and `Accept: text/markdown` requests here:
// /md is the home page, /md/sitemap the content index, /md/<path> any other machine page.
import { toMarkdown, sitemap } from "@/lib/machine/markdown";
import { docByPath, docs } from "@/lib/machine/pages";

export const dynamicParams = false;
export const generateStaticParams = () => [
  { path: [] },
  { path: ["sitemap"] },
  ...docs.filter((d) => d.path !== "home").map((d) => ({ path: d.path.split("/") })),
];

export async function GET(_: Request, { params }: RouteContext<"/md/[[...path]]">) {
  const path = (await params).path?.join("/") ?? "home";
  const doc = docByPath(path);
  const body = path === "sitemap" ? sitemap() : doc && toMarkdown(doc);
  if (!body) return new Response("Not found\n", { status: 404 });
  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
