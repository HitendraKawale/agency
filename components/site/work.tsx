"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import Media from "./media";
import { PROJECTS, TILES, type Project } from "./projects";

const LEAVE_DELAY = 200;

/** Glyph texture for work that cannot be shown yet. */
const REDACTED = Array.from({ length: 48 }, (_, row) =>
  "unannounced ".repeat(12).slice(row % 12, row % 12 + 120),
).join("\n");

function Meta({ project }: { project: Project }) {
  return (
    <div className="tile-meta label">
      <span>{project.name}</span>
      <span className="dim">
        {project.kind}, {project.year}
      </span>
    </div>
  );
}

/** Client sites open in a new tab; case studies stay on this site. */
const isExternal = (href: string) => /^https?:/.test(href);

function Tile({
  project,
  children,
  className,
  active,
  onEnter,
  onLeave,
}: {
  project: Project;
  children: ReactNode;
  className: string;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const shared = {
    className: `tile ${className}`,
    "data-active": active,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
  };
  if (project.href && isExternal(project.href)) {
    return (
      <a href={project.href} target="_blank" rel="noopener noreferrer" {...shared}>
        {children}
      </a>
    );
  }
  return project.href ? (
    <Link href={project.href} {...shared}>
      {children}
    </Link>
  ) : (
    <div {...shared} tabIndex={0} aria-label={`${project.name} ${project.kind.toLowerCase()}`}>
      {children}
    </div>
  );
}

/**
 * Aino's work index. Hovering a tile lights every tile of the same project
 * and greys the rest; leaving waits 200ms so moving between a project's
 * frames doesn't flicker. On /projects it also has the Grid / List switch.
 */
export default function Work({ title, toggle = false }: { title?: string; toggle?: boolean }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [group, setGroup] = useState<string | null>(null);
  const leaveTimer = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const enter = (id: string) => {
    window.clearTimeout(leaveTimer.current);
    setGroup(id);
  };
  const leave = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setGroup(null), LEAVE_DELAY);
  };

  const movePreview = (event: React.PointerEvent) => {
    const node = previewRef.current;
    if (!node) return;
    node.style.transform = `translate(${event.clientX + 24}px, ${event.clientY - 40}px)`;
  };

  return (
    <div data-hover-root>
      {title || toggle ? (
        <div className="row work-head">
          {title ? <h1 className="t-mega">{title}</h1> : null}
          {toggle ? (
            <div className="view-toggle label" role="group" aria-label="View">
              <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                Grid
              </button>
              <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
                List
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {view === "grid" ? (
        <div className="row work-grid" data-hovering={group !== null}>
          {TILES.map(({ project, frame }, index) =>
            frame ? (
              <Tile
                key={frame.src}
                project={project}
                className={`span-${frame.span}${frame.start ? ` start-${frame.start}` : ""}${frame.shape === "wide" ? " wide" : ""}`}
                active={group === project.id}
                onEnter={() => enter(project.id)}
                onLeave={leave}
              >
                <Media src={frame.src} alt={frame.alt} decode={index} className={frame.shape} />
                <Meta project={project} />
              </Tile>
            ) : (
              <Tile
                key={project.id}
                project={project}
                className="span-2"
                active={group === project.id}
                onEnter={() => enter(project.id)}
                onLeave={leave}
              >
                <div className="media redacted code" aria-hidden="true">
                  <pre>{REDACTED}</pre>
                </div>
                <Meta project={project} />
              </Tile>
            ),
          )}
        </div>
      ) : (
        <>
          <ol className="work-list label" onPointerMove={movePreview}>
            {PROJECTS.map((project, index) => {
              const cells = (
                <>
                  <span className="dim">{String(index + 1).padStart(2, "0")}</span>
                  <span className="name">{project.name}</span>
                  <span>{project.kind}</span>
                  <span>{project.year}</span>
                  <span className={project.status === "soon" ? "dim" : undefined}>
                    {project.status === "live" ? "Live" : "Soon"}
                  </span>
                </>
              );
              return (
                <li key={project.id}>
                  {project.href ? (
                    <Link
                      className="line"
                      href={project.href}
                      {...(isExternal(project.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      onPointerEnter={() => setPreview(project.frames[0]?.src ?? null)}
                      onPointerLeave={() => setPreview(null)}
                    >
                      {cells}
                    </Link>
                  ) : (
                    <div className="line">{cells}</div>
                  )}
                </li>
              );
            })}
          </ol>
          <div ref={previewRef} className="work-preview" data-visible={preview !== null} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview} alt="" /> : null}
          </div>
        </>
      )}
    </div>
  );
}
