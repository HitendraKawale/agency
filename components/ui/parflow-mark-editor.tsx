"use client";

/**
 * The Parflow mark, live inside the vector rig — the artefact of the rebrand
 * rather than a picture of it. The frame chrome draws itself open when the
 * section scrolls into view; after that the points are real and draggable.
 *
 * The mark is Parflow's brand blue; the rig is the studio's mint, so it reads
 * as our tool holding their asset rather than a Figma screenshot.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FigmaFrame, type FrameStyle } from "@/components/svg-editor/FigmaFrame";
import {
  VectorEditor,
  type EditorStyle,
} from "@/components/svg-editor/VectorEditor";
import { parsePath } from "@/components/svg-editor/parse";
import type { VectorPath } from "@/components/svg-editor/types";

/** Parflow's swirl mark, straight from the identity's Icon.svg. */
const MARK_D =
  "M0.822031 163.761C-0.356969 158.839 0.074029 142.602 0.089029 136.613C0.170029 103.406 -1.88999 79.0944 16.797 49.1354C31.123 26.1684 54.211 8.86336 80.62 2.60436C95.485 -0.918643 117.786 0.138353 133.595 0.181353L198.561 0.315355L259.298 0.166353C271.432 0.136353 288.155 -0.386639 299.785 1.27736C313.892 3.37636 327.429 8.30835 339.58 15.7764C422.677 67.2894 402.519 197.286 307.338 219.591C265.313 229.439 206.658 204.881 179.313 248.463C156.61 288.699 189.683 323.77 145.604 369.232C134.156 381.248 119.414 389.615 103.228 393.283C82.413 397.997 60.578 394.193 42.583 382.718C22.23 369.903 7.79801 349.533 2.45701 326.082C-3.41199 299.694 1.49901 272.055 16.099 249.304C31.043 226.355 54.438 210.229 81.202 204.429C96.845 201.038 122.291 202.096 139.171 202.127L217.684 202.289C239.499 202.34 261.549 206.536 276.673 187.916C279.777 183.225 280.648 181.012 282.78 175.822C286.884 154.969 277.502 131.815 253.969 129.576C231.393 128.926 206.848 127.449 184.263 128.643C124.379 131.81 65.524 114.085 21.793 165.704C14.961 173.315 6.16703 172.586 0.822031 163.761Z";

const VIEW_BOX: [number, number, number, number] = [0, 0, 392, 396];
const PARFLOW_BLUE = "#0055fc";
const MINT = "#1cffaf";

const FRAME: FrameStyle = {
  accent: MINT,
  handleSize: 8,
  handleFill: "#f3f3f1",
  borderWidth: 1,
  showHandles: true,
  showBadge: true,
  badgeBg: MINT,
  badgeText: "#000000",
};

const EDITOR: EditorStyle = {
  accent: MINT,
  arm: "rgba(28, 255, 175, 0.38)",
  anchorR: 4.5,
  handleR: 3.4,
  pointFill: "#0a0a0a",
  fill: PARFLOW_BLUE,
  fillOpacity: 0.92,
  stroke: PARFLOW_BLUE,
  strokeWidth: 1.5,
  showRig: true,
  fillRule: "evenodd",
};

const SIZE = 300;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Subscribe to the reduced-motion preference without setState-in-effect. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false, // server render: assume motion is fine, correct on hydrate
  );
}

export default function ParflowMarkEditor() {
  const initial = useMemo(() => parsePath(MARK_D), []);
  const [path, setPath] = useState<VectorPath>(initial);
  const [inView, setInView] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Derived, not stored — no cascading render when the preference resolves.
  const mounted = inView || reduced;
  const animate = !reduced;

  // Hold the frame back until it's actually on screen, so the draw-open lands
  // where the reader is looking rather than in a section already scrolled past.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [reduced]);

  const dirty = path !== initial;

  return (
    <div className="mark-editor">
      {/* Reserve the box so revealing the frame doesn't shove the layout. */}
      <div
        ref={hostRef}
        className="mark-editor-stage"
        style={{ minHeight: SIZE + 30 }}
      >
        {mounted && (
          <FigmaFrame
            style={FRAME}
            width={VIEW_BOX[2]}
            height={VIEW_BOX[3]}
            animate={animate}
          >
            <VectorEditor
              path={path}
              onChange={setPath}
              style={EDITOR}
              viewBox={VIEW_BOX}
              width={SIZE}
              height={Math.round((SIZE * VIEW_BOX[3]) / VIEW_BOX[2])}
              className={animate ? "mark-editor-svg" : undefined}
            />
          </FigmaFrame>
        )}
      </div>

      <div className="mark-editor-bar">
        <p>drag the points — alt-drag breaks the tangent</p>
        <button
          type="button"
          onClick={() => setPath(initial)}
          disabled={!dirty}
          aria-label="Restore the original Parflow mark"
        >
          reset
        </button>
      </div>
    </div>
  );
}
