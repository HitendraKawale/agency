import FilmstripVideoPlayer from "@/components/ui/filmstrip-video-player";

type Clip = { src: string; stills: string; duration: number };

/** Clips the Filmstrip can play; stills are 1.jpg … 9.jpg under `stills`. */
export const CLIPS = {
  // 26.3 s, recorded from parflowengineering.com (public/media/PROVENANCE.md).
  parflow: { src: "/media/parflow-walkthrough.mp4", stills: "/media/parflow-walkthrough", duration: 26.3 },
} satisfies Record<string, Clip>;

function stamp(seconds: number) {
  const whole = Math.round(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/** The Filmstrip player, full bleed, with a label in each top corner. */
export default function Reel({ clip, left, right }: { clip: Clip; left: string; right: string }) {
  return (
    <section className="reel" aria-label={right}>
      <FilmstripVideoPlayer
        videoSrc={clip.src}
        frames={Array.from({ length: 9 }, (_, i) => `${clip.stills}/${i + 1}.jpg`)}
        timestamps={Array.from({ length: 13 }, (_, i) => stamp((i * clip.duration) / 12))}
        markerColor="#DFEAE8"
      />
      <div className="reel-tag label">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </section>
  );
}
