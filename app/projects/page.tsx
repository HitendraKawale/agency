import type { Metadata } from "next";
import Link from "next/link";
import LineRise from "@/components/ui/line-rise";

export const metadata: Metadata = {
  title: "projects — blank interfaces",
  description:
    "Selected 0→1 work by blank interfaces — built alongside founding teams, remotely from Mumbai and the UK.",
};

const PROJECTS = [
  {
    name: "parflow engineering",
    href: "/projects/parflow-engineering",
    category: "Case study",
    status: "live",
  },
  {
    name: "Unannounced",
    category: "Product",
    status: "soon",
  },
  {
    name: "Unannounced",
    category: "Interface",
    status: "soon",
  },
] as const;

export default function ProjectsPage() {
  return (
    <main className="min-h-[100svh] bg-black text-[#f3f3f1]">
      <header className="page-header">
        <Link href="/">blank interfaces</Link>
        <span>mumbai · uk · remote</span>
      </header>

      <section className="library page-library" aria-labelledby="projects-title">
        <LineRise>
          <h1 id="projects-title" className="page-title">
            Projects
          </h1>
        </LineRise>
        <div className="library-head" aria-hidden="true">
          <span>project</span>
          <span>category</span>
          <span>status</span>
        </div>
        <ol className="library-list">
          {PROJECTS.map((project, i) => (
            <li
              key={`${project.name}-${i}`}
              className={`library-row${project.status === "soon" ? " is-muted" : ""}`}
            >
              <div className="library-name">
                <LineRise delay={i * 0.08}>
                  <h3>
                    {"href" in project ? (
                      <Link href={project.href}>
                        {project.name}
                        <span aria-hidden="true"> →</span>
                      </Link>
                    ) : (
                      <>
                        {project.name}
                        <span className="library-badge">soon</span>
                      </>
                    )}
                  </h3>
                </LineRise>
              </div>
              <span className="library-category">{project.category}</span>
              <span className="library-index">remote · {project.status}</span>
            </li>
          ))}
        </ol>
        <p className="library-footnote">
          Every one of these was built alongside the team that owns it —
          Mumbai, the UK, and wherever you are. More are taking shape, quietly.
        </p>
        <p className="library-footnote">
          <a className="page-back" href="mailto:hello@aryank.space">
            hello@aryank.space
          </a>
        </p>
      </section>

      <footer className="site-footer">
        <p>© 2026 blank interfaces · mumbai / uk / remote</p>
        <Link href="/">back home</Link>
      </footer>
    </main>
  );
}
