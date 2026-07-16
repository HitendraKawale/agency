import type { Metadata } from "next";
import Link from "next/link";
import LineRise from "@/components/ui/line-rise";

export const metadata: Metadata = {
  title: "projects — blank interfaces",
  description:
    "Selected projects by blank interfaces — built remotely from Mumbai and the UK.",
};

const PROJECTS = [
  {
    name: "arth technologies",
    href: "https://www.arthtechnologies.com/",
    category: "Platform",
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
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {project.name}
                        <span aria-hidden="true"> ↗</span>
                      </a>
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
          All projects run remotely — Mumbai, the UK, and wherever you are.
          More are taking shape, quietly.
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
