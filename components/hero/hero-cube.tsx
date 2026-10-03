"use client";

import { useRef, useState } from "react";
import VideoSummagator, { type VideoSummagatorHandle } from "@/components/ui/video-summagator";

export interface HeroCubeProps {
  foreground: string;
  /** Stops the gentle orbit; scrubbing and dragging still work. */
  reducedMotion: boolean;
}

/** Whole-second clock for the scrubber's end labels. */
function clock(seconds: number) {
  const whole = Math.round(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * A night-street clip unfolded into a time cube, with a paradigm-style
 * scrubber on the left. Mounted only while its visual is selected: it owns a
 * WebGL context and decodes the clip with one seek per sample.
 */
export default function HeroCube({ foreground, reducedMotion }: HeroCubeProps) {
  const cube = useRef<VideoSummagatorHandle>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const ready = duration > 0;
  const progress = ready ? Math.min(time / duration, 1) : 0;

  function scrub(seconds: number) {
    setPlaying(false);
    setTime(seconds);
    cube.current?.seek(seconds);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="hero-cube">
        <VideoSummagator
          ref={cube}
          src="/media/hero-cube.mp4"
          sampleLabel="Night street"
          quality={160}
          chrome={false}
          pageScroll
          background="transparent"
          ink={foreground}
          playing={playing}
          autoRotate={!reducedMotion}
          onPlayingChange={setPlaying}
          onReady={(info) => setDuration(info.duration)}
          onTimeChange={(seconds, total) => {
            setTime(seconds);
            setDuration(total);
          }}
        />
      </div>
      <div className="hero-scrubber" data-ready={ready || undefined}>
        <button type="button" className="hero-scrubber-play" disabled={!ready} onClick={() => setPlaying((value) => !value)}>
          {playing ? "Pause" : "Play"}
        </button>
        <div className="hero-scrubber-track">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={time}
            disabled={!ready}
            aria-label="Time"
            aria-valuetext={`${time.toFixed(1)} of ${duration.toFixed(1)} seconds`}
            onChange={(event) => scrub(Number(event.target.value))}
          />
          <span className="hero-scrubber-tick" aria-hidden="true" style={{ left: `${progress * 100}%` }} />
        </div>
        <div className="hero-scrubber-ends">
          <button type="button" disabled={!ready} aria-label="Jump to 00:00" onClick={() => scrub(0)}>
            00:00
          </button>
          <button type="button" disabled={!ready} aria-label={`Jump to ${clock(duration)}`} onClick={() => scrub(duration)}>
            {clock(duration)}
          </button>
        </div>
      </div>
    </>
  );
}

const styles = `
/* The full hero height, behind the header: a transparent canvas keeps the grain field and no seam. */
.hero-cube { position: absolute; inset: -108px 0 0; }
/* The canvas focus ring follows the hero ink instead of the component's gold. */
.hero-cube .vsum-root { color: inherit; color-scheme: light; --vsum-accent: currentColor; }
.hero-scrubber {
  position: absolute;
  left: max(24px, calc((100% - 1752px) / 2 + 24px));
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 173px;
  font: 10px/1 "Search System Pro Mono", ui-monospace, monospace;
  opacity: 0;
  visibility: hidden;
  transition: opacity 300ms ease-out, visibility 0s 300ms;
}
.hero-scrubber[data-ready] { opacity: 1; visibility: visible; transition: opacity 300ms ease-out; }
.hero-scrubber button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  transition: opacity 140ms ease-out;
}
.hero-scrubber button:hover { opacity: .55; }
.hero-scrubber .hero-scrubber-play { display: block; margin-bottom: 12px; }
.hero-scrubber-track { position: relative; height: 18px; }
.hero-scrubber-track::before {
  content: "";
  position: absolute;
  inset: 50% 0 auto;
  height: 1px;
  background: currentColor;
  pointer-events: none;
}
.hero-scrubber-track input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: ew-resize;
}
.hero-scrubber-track input::-webkit-slider-runnable-track { height: 18px; background: transparent; }
.hero-scrubber-track input::-moz-range-track { height: 18px; background: transparent; border: 0; }
.hero-scrubber-track input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 1px; height: 15px; background: transparent; border: 0; }
.hero-scrubber-track input::-moz-range-thumb { width: 1px; height: 15px; background: transparent; border: 0; border-radius: 0; }
.hero-scrubber-tick {
  position: absolute;
  top: 50%;
  width: 1px;
  height: 10px;
  background: currentColor;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.hero-scrubber-track:hover .hero-scrubber-tick { height: 14px; }
.hero-scrubber-ends { display: flex; justify-content: space-between; margin-top: 9px; }
@media (max-width: 767px) {
  .hero-scrubber { left: 50%; top: auto; bottom: 84px; transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-scrubber, .hero-scrubber button { transition: none; }
}
`;
