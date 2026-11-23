// Markdown twins, as basement serves them: /services.md, and /services asked for with
// `Accept: text/markdown`, both answer from app/md. /index.md and / are the home page.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let path: string | undefined;
  if (pathname.endsWith(".md")) path = pathname.slice(0, -3);
  else if (request.headers.get("accept")?.includes("text/markdown")) path = pathname;
  if (path === undefined) return;
  const twin = path === "/" || path === "/index" ? "" : path;
  return NextResponse.rewrite(new URL(`/md${twin}`, request.url));
}

export const config = {
  // pages only: no Next internals, API routes, /ai, /md or files with other extensions
  matcher: ["/((?!_next/|api/|ai/|md/|_realtime|.*\\.(?!md$)[^/]+$).*)"],
};
