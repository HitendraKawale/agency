# Add the opening text animation

## Goal

The homepage currently opens with a static logo. The first visual should instead show a restrained text-generation sequence inspired by Paradigm's opening self-attention demo.

After this change, the hero keeps Blank's navigation and identity while its center renders words one fragment at a time, with a small context readout and a pause control. We prove it with a browser pass and reduced-motion behavior.

## Flow

```text
static logo -> token text hero -> words + context readout -> rest of homepage
```

## Files

| File | Today | After |
| --- | --- | --- |
| `components/ui/halftone-interface-hero.tsx` | renders the static lockup as the hero focal point | renders a client-side token sequence with context labels, pause control, and the existing shell |
| `app/page.tsx` | supplies `headline` and `brand` to the hero | supplies Blank's own short statement for the sequence |

## Implementation choices

The animation will use a fixed list of meaningful fragments, a 120ms reveal interval, and a 30 second loop. Each fragment gets a stable inline element so the layout stays readable while the sequence advances. The pause button stops the timer. `prefers-reduced-motion` renders the full sentence immediately and hides the timer-driven behavior.

```diff
- <Image src="/blank-interfaces-lockup-inverted.svg" ... />
+ <div className="hih-token-stage" aria-live="polite">
+   {visibleTokens.map((token) => <span key={token.id}>{token.text}</span>)}
+ </div>
+ <button onClick={() => setPaused((value) => !value)}>
+   {paused ? "Play animation" : "Pause animation"}
+ </button>
```

## What I am not doing

I am not copying Paradigm's proprietary visualizations, data, typeface, or source code. I am not changing the rest of the homepage, navigation, or lower-page animations in this pass.
