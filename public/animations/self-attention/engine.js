const ot=`
/* Theme bridge: the site's resolved color tokens cross the shadow boundary (custom
   properties inherit through it), so the visual tracks light/dark with no JS setColors()
   hook. Secondary inks are the primary ink mixed toward transparent; knockout halos use
   the page surface so they mask correctly on either background. Green accent is constant. */
:host {
    --sa-surface: var(--color-surface-default, #ffffff);
    --sa-ink: var(--color-text-default, #000000);
    --sa-accent: #00ff41;
    --sa-ink-88: color-mix(in srgb, var(--sa-ink) 88%, transparent);
    --sa-ink-82: color-mix(in srgb, var(--sa-ink) 82%, transparent);
    --sa-ink-72: color-mix(in srgb, var(--sa-ink) 72%, transparent);
    --sa-ink-62: color-mix(in srgb, var(--sa-ink) 62%, transparent);
    --sa-ink-muted: color-mix(in srgb, var(--sa-ink) 55%, transparent);
}

:host {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--sa-surface);
    color: var(--sa-ink);
    overflow: hidden;
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
}
*, *::before, *::after { box-sizing: border-box; }

:host {
    --connection-color: var(--sa-ink);
    --suggestion-offset-x: 4px;
    --suggestion-offset-y: -24px;
    --weight-label-offset-y: 18px;
    --suggestion-visible-rows: 300;
    --suggestion-reserved-rows: 12;
    /* Uniformly scales the whole speed control (readout + slider + labels) and
       nothing else. Override from the page, e.g. <self-attention style="--speed-nav-scale: 1.4">. */
    --speed-nav-scale: 0.75;
    /* Distance from the container's left edge to the speed control. Anchored to
       the content grid's left margin so the control lines up with the gallery
       [N] bullets (VisualList) instead of a raw offset: below --layout-max-width
       the max() falls back to a plain --grid-margin; on ultra-wide it tracks
       the centred layout container. Uses 100cqw (not 100vw) to stay consistent
       with --speed-nav-band below and the component's query-container design, so
       it stays correct inside a narrower-than-viewport slot. Site tokens inherit
       through the shadow boundary. Same clamp as the treemap / Erdos chrome. */
    --speed-nav-left: max(var(--grid-margin), calc((100cqw - var(--layout-max-width)) / 2 + var(--grid-margin)));
    /* Horizontal space the left-pinned speed control needs, measured from the
       container's left edge: its left offset plus its (scaled) ~16rem footprint.
       The content reserves this much room when there's no natural centering gutter,
       so moving/scaling the control never lets the content slide under it. */
    --speed-nav-band: calc(var(--speed-nav-left) + 16rem * var(--speed-nav-scale));
    /* ▼▼▼ MOBILE READOUT Y POSITION ▼▼▼
       On mobile only, the "Nx slowed down [N t/sec]" readout sits centred at the
       bottom. It anchors to the shared landing caption line so it sits a consistent
       spacing-4 above the [N] bullets, matching the treemap date + Erdős step label
       instead of floating mid-page (PARWEB-593). The site token inherits through the
       shadow boundary. */
    --readout-mobile-bottom: var(--landing-caption-bottom);
}


.app-shell {
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    /* Make the shell a query container so responsive rules below key off the
       component's own width, not the page viewport. This is what lets the embed
       behave correctly inside a fixed-size slot that's narrower than the viewport. */
    container-type: inline-size;
    /* Nothing is selectable by default; only the sentence's own text opts back in
       (see #sentence-container .token). Keeps the speed control, the micro
       weight-labels, and the prediction dropdown out of any text selection. */
    user-select: none;
    -webkit-user-select: none;
}

.app-main {
    position: relative;
    z-index: 20;
    max-width: 72rem;
    width: 100%;
    height: 100%;
    padding-left: 2rem;
    padding-right: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.sentence-display {
    font-size: 2.25rem;
    text-align: center;
    line-height: 1.5;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    /* Vertical breathing room between wrapped lines so the attention rails have a
       gap to sit in without crossing the text. */
    row-gap: 0.5em;
    min-height: 160px;
}

@container (max-width: 767px) {
    .sentence-display {
        font-size: 1.5rem;
    }
    .sentence-break {
        display: none;
    }
    /* The slider + labels don't fit on narrow screens, but we still want the speed
       readout. Re-anchor the whole control to the bottom-centre (overriding the base
       left/centre anchoring) and reveal ONLY the readout. The .app-shell prefix
       outranks the base #speed-nav rule defined later. */
    .app-shell #speed-nav {
        left: 50%;
        right: auto;
        top: auto;
        bottom: var(--readout-mobile-bottom);
        transform: translateX(-50%);
        align-items: center;
        pointer-events: none;
    }
    /* Hide every part of the control except the readout. */
    .app-shell #speed-nav .speed-nav-standard,
    .app-shell #speed-nav .speed-timeline-track-row,
    .app-shell #speed-nav .speed-timeline-ends-below {
        display: none;
    }
    /* Force the readout's own container visible even though the rest is hidden. */
    .app-shell #speed-nav .speed-nav-timeline {
        display: block;
    }
    .app-shell #speed-nav .speed-timeline-readout {
        margin-bottom: 0;
        text-align: center;
    }
    /* On mobile the attention rails + their down-ticks sit on the grey weight
       labels; shift the whole SVG line layer down 3px so the lines (and ticks)
       clear the numbers. Pure visual offset — desktop is unaffected. */
    #attention-canvas {
        transform: translateY(3px);
    }
}

@container (min-width: 768px) {
    .sentence-display {
        font-size: 3.75rem;
    }
    /* The speed control is pinned to the left gutter, but the content is centered
       within its 72rem cap — so on mid-width viewports (~768–1360px) the content
       has no gutter to sit in and slides under the nav. Reserve enough left padding
       to clear the nav, minus whatever natural centering gutter already exists
       (half the space outside the 72rem cap). This pins the content's left edge
       just right of the nav until the viewport is wide enough to clear it on its
       own, at which point it relaxes back to the normal 2rem and re-centers. */
    .app-main {
        padding-left: max(2rem, var(--speed-nav-band) - max(0px, (100cqw - 72rem) / 2));
    }
}

@container (min-width: 1024px) {
    .sentence-display {
        font-size: 4.5rem;
    }
}

.mono {
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
    font-weight: 400;
}

.force-single-line {
    flex-wrap: nowrap !important;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: visible;
    justify-content: flex-start !important;
    text-align: left;
    padding-bottom: 1.3rem;
    scrollbar-width: none;
    width: 100%;
    align-self: stretch;
}

.force-single-line::-webkit-scrollbar {
    display: none;
}

.force-single-line .token-wrapper {
    flex: 0 0 auto;
}

.app-shell.viewport-pan-on .force-single-line {
    justify-content: center;
    overflow-x: hidden;
}

.suggestion-layer {
    position: absolute;
    inset: 0;
    /* Behind the token text (wrappers are z-index 20) so the prediction dropdown
       never cuts off already-generated tokens — text shows through where they overlap. */
    z-index: 15;
    pointer-events: none;
    overflow: visible;
}

#adventure-layer {
    position: absolute;
    inset: 0;
    z-index: 18;
    pointer-events: none;
    overflow: hidden;
    display: none;
    font-size: 72px;
    line-height: 1.2;
}

#adventure-anchor-line {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 40vh;
    height: 2px;
    display: none;
}

#adventure-stage {
    position: absolute;
    left: 10vw;
    bottom: 40vh;
    margin-bottom: -6px;
    transform: translateX(0px);
    transition: none;
    will-change: transform;
}

#adventure-content {
    width: max-content;
}

.adventure-node {
    display: flex;
    align-items: baseline;
    animation: none;
}

.adventure-large {
    font-size: 1em;
    line-height: 1.2;
    color: var(--sa-ink);
    margin-right: 0.34em;
    white-space: nowrap;
}

.adventure-large-word {
    display: inline;
}

.adventure-word-wrap {
    display: inline-flex;
    align-items: baseline;
}

.adventure-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.02em;
}

.adventure-phase {
    font-size: 0.15em;
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sa-ink-muted);
    margin-bottom: 0.25em;
}

.adventure-stack-row {
    display: flex;
    align-items: flex-start;
}

.adventure-small {
    font-size: 8px; /* secondary annotation, kept proportionally below the 10px primary now the nav is unscaled (PARWEB-566) */
    line-height: 1.15;
    color: var(--sa-ink-72);
    white-space: nowrap;
    margin-right: 0.34em;
}

.adventure-small.selected {
    color: var(--sa-ink);
}

#speed-nav {
    position: absolute;
    left: var(--speed-nav-left);
    top: 50%;
    transform: translateY(-50%);
    /* --speed-nav-scale sizes the control's geometry (widths / gaps / tick heights)
       directly below, NOT via a transform: scale(), so the labels render at their true
       px size instead of a downscaled bitmap — matching the Erdos nav (PARWEB-566). */
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.app-shell.speed-nav-hidden #speed-nav {
    display: none;
}

.speed-nav-standard {
    display: block;
}

.speed-nav-timeline {
    display: none;
    width: calc(230px * var(--speed-nav-scale));
}

.app-shell.timeline-mode .speed-nav-standard {
    display: none;
}

.app-shell.timeline-mode .speed-nav-timeline {
    display: block;
}

.speed-timeline-readout {
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 10px; /* true 10px, nav no longer transform-scaled (PARWEB-566) */
    line-height: 1;
    color: var(--sa-ink);
    margin-bottom: calc(16px * var(--speed-nav-scale));
}

.speed-timeline-track-row {
    position: relative;
    display: flex;
    align-items: center;
    min-height: calc(24px * var(--speed-nav-scale));
}

.speed-timeline-track-row::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: var(--sa-ink);
    transform: translateY(-50%);
    pointer-events: none;
}

.speed-timeline-end {
    /* Clickable: slams the slider to its corresponding end (see initSpeedNav). */
    appearance: none;
    -webkit-appearance: none;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 10px; /* true 10px, nav no longer transform-scaled (PARWEB-566) */
    line-height: 1;
    color: var(--sa-ink);
    white-space: nowrap;
    /* Green-on-hover for clear interaction feedback, matching the Erdos nav; flips instantly (PARWEB-566). */
}

.speed-timeline-end:hover {
    color: var(--sa-accent);
}

/* While hovering the slider, tint the visible thumb green so the control reads
   as live/grabbable — same green-on-hover affordance as the end labels. */
.speed-timeline-track-row:hover .speed-timeline-thumb {
    background: var(--sa-accent);
}

/* End-label slam (Detailed / Realtime): glide the thumb across the full track
   with the slower easeInOutQuint so the jump reads as a deliberate animation,
   not a teleport. Added for the duration of the move, then removed. */
.speed-timeline-thumb.thumb-slam {
    transition: left 320ms cubic-bezier(0.83, 0, 0.17, 1);
}

.speed-timeline-ends-below {
    margin-top: calc(12px * var(--speed-nav-scale));
    display: flex;
    justify-content: space-between;
}

.speed-timeline-slider {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    height: calc(24px * var(--speed-nav-scale));
    background: transparent;
    border-radius: 0;
    outline: none;
    margin: 0;
    transition: none;
}

.speed-timeline-slider::-webkit-slider-runnable-track {
    height: calc(24px * var(--speed-nav-scale));
    background: transparent;
}

.speed-timeline-slider::-moz-range-track {
    height: calc(24px * var(--speed-nav-scale));
    background: transparent;
    border: 0;
}

/* Native thumb is transparent — it still handles drag/keyboard interaction, but
   the visible thumb is .speed-timeline-thumb so it can ease between steps. */
.speed-timeline-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1px;
    height: calc(20px * var(--speed-nav-scale));
    background: transparent;
    border: none;
}

.speed-timeline-slider::-moz-range-thumb {
    width: 1px;
    height: calc(20px * var(--speed-nav-scale));
    background: transparent;
    border: none;
    border-radius: 0;
}

.speed-timeline-thumb {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 1px;
    height: calc(13px * var(--speed-nav-scale));
    background: var(--sa-ink);
    transform: translate(-50%, -50%);
    pointer-events: none;
    /* Track the finger immediately on direct drag: a short ease-out reads as
       instant feedback (the old 210ms easeInOutQuint felt laggy on each step). */
    transition: left 90ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: left;
}

.speed-nav-title {
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 10px; /* true 10px, nav no longer transform-scaled (PARWEB-566) */
    line-height: 1.7;
    color: var(--sa-ink-82);
    margin-bottom: calc(2px * var(--speed-nav-scale));
}

.speed-nav-item {
    display: flex;
    align-items: baseline;
    gap: calc(6px * var(--speed-nav-scale));
    background: none;
    border: none;
    padding: 0;
    padding-left: calc(12px * var(--speed-nav-scale));
    cursor: pointer;
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 10px; /* true 10px, nav no longer transform-scaled (PARWEB-566) */
    line-height: 1.7;
    color: var(--sa-ink);
    text-align: left;
}

.speed-nav-item:hover {
    color: var(--sa-accent);
}

.speed-nav-item.active {
    color: var(--sa-accent);
}

.speed-nav-wps {
    font-size: 10px; /* true 10px, nav no longer transform-scaled (PARWEB-566) */
    min-width: 0;
}

#attention-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    /* Above the token wrappers (z-index 20) so the rails draw ON TOP of the weight
       labels' backgrounds; still below the prediction list (z-index 25). */
    z-index: 21;
}

.attention-line {
    stroke: var(--connection-color);
    fill: none;
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
    shape-rendering: crispEdges;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    stroke-linecap: round;
    stroke-linejoin: round;
}

/* Draw the structure (spine + horizontal rails) first… */
.attention-rail {
    animation-duration: 0.45s;
}
/* …then bring the down-ticks in, after the rail has reached them. */
.attention-tick {
    animation-duration: 0.3s;
    animation-delay: 0.34s;
}

.attention-line-outline {
    stroke: color-mix(in srgb, var(--sa-surface) 90%, transparent);
    stroke-width: 1px;
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: none;
    opacity: 0.9;
}

.app-shell.multiline-mode .attention-line,
.app-shell.paragraph-mode .attention-line {
    stroke-width: 1px;
}

.attention-line.adventure-attention-line {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: none;
    opacity: 0.6;
}

.speed-realtime .attention-line {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: none;
}


@keyframes drawLine {
    to {
        stroke-dashoffset: 0;
    }
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

@keyframes popIn {
    0% {
        opacity: 0;
        transform: translateY(3px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}


/* A word group keeps a word's sub-token chunks on one line (no mid-word wrap). */
.word-group {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
}

.token-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 0;
    margin-right: 0;
    position: relative;
    z-index: 20;
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(1);
    top: 0;
    transition: top 170ms ease;
    will-change: transform, opacity;
}

.app-shell.viewport-pan-on .token-wrapper {
    transition: top 170ms ease, left 150ms ease-out, transform 150ms ease-out;
}

.sentence-break {
    flex-basis: 100%;
    width: 100%;
    height: 0.5em;
}

.token-wrapper.split-join-left {
    margin-right: 0;
}

.token-wrapper.split-join-right {
    margin-left: 0;
}

.token-wrapper.predicting .token {
    opacity: 0;
}

.predictor-hint {
    position: absolute;
    left: 0;
    top: 0;
    min-width: 200px;
    max-height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    pointer-events: none;
    text-align: left;
    background: var(--sa-surface);
    padding: 6px 8px;
    border-radius: 6px;
}

.predictor-stage {
    font-size: 9px;
    color: var(--sa-ink-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 2px;
}

.predictor-stack {
    display: flex;
    flex-direction: column;
    gap: 1px;
    align-items: flex-start;
    min-height: 0;
    max-height: calc(100vh - 34px);
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
}

.predictor-stack::-webkit-scrollbar {
    display: none;
}

.suggestion-layer.suggestions-anchor-bottom .predictor-stack {
    flex-direction: column-reverse;
}

.predictor-option {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    font-size: 10px;
    line-height: 1.15;
    color: var(--sa-ink-88);
    transform: translateY(0);
}

.predictor-weight {
    color: var(--sa-ink-62);
    font-variant-numeric: tabular-nums;
}

.predictor-option.is-new {
    animation: pushUpIn 170ms ease;
}

.predictor-option-selected {
    color: var(--sa-accent);
}

@keyframes pushUpIn {
    0% {
        opacity: 0;
        transform: translateY(8px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}


.token-wrapper.is-punctuation {
    margin-left: -0.22em;
    margin-right: 0.18em;
}

.token {
    position: relative;
    display: inline-block;
    font-family: inherit;
    letter-spacing: -0.02em;
    transition: color 0.3s ease;
    padding-bottom: 0.25rem;
}

/* The only selectable thing: the sentence's actual display text. Re-enables
   selection that .app-shell turned off globally, scoped to the sentence tokens. */
#sentence-container .token {
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
}

.split-join-dot {
    position: absolute;
    left: calc(100% + 0.14em);
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.58em;
    line-height: inherit;
    color: var(--sa-ink);
    font-family: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    pointer-events: none;
    z-index: 24;
    animation: fadeIn 0.25s ease;
}

.token::after {
    content: none;
}

.token-wrapper.active .token::after {
    transform: none;
}

@keyframes connectionFlash {
    0% {
        color: inherit;
        text-shadow: none;
    }
    1% {
        color: var(--sa-accent);
        text-shadow: none;
    }
    99% {
        color: var(--sa-accent);
        text-shadow: none;
    }
    100% {
        color: inherit;
        text-shadow: none;
    }
}

.token-wrapper .token {
    /* Render the glyphs above the weight label (z-index 3) so descenders (g, p, y)
       aren't clipped by the label's background now that the labels sit higher. */
    position: relative;
    z-index: 4;
    transition: none;
}

.token-wrapper.connection-flash .token {
    color: var(--sa-accent);
    transition: none;
}

.adventure-word-wrap.connection-flash .token {
    animation: connectionFlash 300ms steps(1, end);
}

.adventure-small.token {
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
    font-weight: 400;
}

.weight-label {
    position: absolute;
    bottom: calc(-1.45rem + var(--weight-label-offset-y));
    left: 50%;
    transform: translateX(-50%);
    color: var(--sa-ink-62);
    font-family: 'Paradigm SemiMono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-weight: 400;
    font-size: 10px;
    /* Tight digits + minimal padding so adjacent labels under narrow tokens
       collide as little as possible (they're tabular, so columns still align). */
    letter-spacing: -0.02em;
    background: var(--sa-surface);
    border-radius: 999px;
    padding: 1px 3px;
    z-index: 3;
    box-shadow: 0 0 0 0.5px color-mix(in srgb, var(--sa-surface) 85%, transparent);
    opacity: 0;
    animation: fadeIn 0.3s ease 0.2s forwards;
    pointer-events: none;
    white-space: nowrap;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
}

.app-shell.speed-realtime .weight-label {
    opacity: 1;
    animation: none;
}
`,it="./assets/data/paragraph_traces_v5.json",at=new Set(["a","an","the","is","are","was","were","be","been","being","to","of","on","in","at","by","for","from","with","and","or","but","if","as","that","this","these","those","it","its","while","using","for","large","real","time"]),B=[{name:"fast",weight:.35,thinkingDuration:[700,1300],thinkingTick:[70,135],connectHold:[90,200],pruneHold:[35,80],finalHold:[70,130],nextWordPause:[20,48],nonContentPause:[10,20]},{name:"normal",weight:.45,thinkingDuration:[1700,2500],thinkingTick:[125,210],connectHold:[220,380],pruneHold:[75,150],finalHold:[120,210],nextWordPause:[50,90],nonContentPause:[20,34]},{name:"slow",weight:.2,thinkingDuration:[3200,4600],thinkingTick:[210,360],connectHold:[420,760],pruneHold:[140,280],finalHold:[220,420],nextWordPause:[110,210],nonContentPause:[36,64]}],st={sentencePause:900},de={min:.45,max:1.05},rt=3;function lt(e){const t=R[e]||{words:[]};if(!ae||dt||R.length<=1)return{seq:t,step:1};const i=ae?ht:Math.min(pt,R.length),a=[],o=[];for(let s=0;s<i;s+=1){const r=R[(e+s)%R.length]||{words:[]},l=Array.isArray(r.words)?r.words:[];l.forEach(d=>a.push(d)),s<i-1&&l.length>0&&o.push(a.length-1)}return{seq:{words:a,breakAfterIndices:o,isCombined:!0},step:i}}let R=[],I=0,P=-1,ye=[],xe={},F=[],x=null,H=.75,k="tenth-speed";const Y=192.2,ue=Y/30,De=Y/150,Fe="tenth-speed";let C=[],O=null,ke=100,ie=!0,ae=!0,Q=null,ct=450,dt=!1;const pt=3,ht=10,ut=Y/250,ft=Y,mt=[250,120,60,30,15,5,1],se=mt.map(e=>Y/e),Ee=3,gt=2;function wt(){const e=L?L.clientWidth:0;return e>0&&e<=767?gt:Ee}function V(e){const t=D(Math.round(e),0,se.length-1);return se[t]}function vt(e){let t=0,n=1/0;for(let i=0;i<se.length;i+=1){const a=Math.abs(se[i]-e);a<n&&(n=a,t=i)}return t}let m=null,L=null,fe=null,me=null,z=[],ge=-1,pe=[],J=new Map,ze=[],y=null,q=null,we=null,$=null,S=null;function bt(){y=m.getElementById("sentence-container"),q=m.getElementById("adventure-layer"),m.getElementById("adventure-stage"),we=m.getElementById("adventure-content"),$=m.getElementById("attention-canvas"),S=m.getElementById("suggestion-layer"),m.getElementById("speed-nav")}function yt(){if(!L)return{x:0,y:0};const e=L.getBoundingClientRect();return{x:e.left,y:e.top}}function A(e){const t=e.getBoundingClientRect(),n=yt();return{left:t.left-n.x,top:t.top-n.y,right:t.right-n.x,bottom:t.bottom-n.y,x:t.left-n.x,y:t.top-n.y,width:t.width,height:t.height}}function xt(){return y}function kt(e=I){return 0}function Me(e,t=I){return kt(t)+e}function Z(e,t=I){return m.getElementById(`token-wrapper-${Me(e,t)}`)}function j(e,t=I){return m.getElementById(`token-${Me(e,t)}`)}function Et(e,t=I){const n=Z(e,t);return!!n&&n.style.display!=="none"}function Mt(){if(!x||x.seqIndex!==I)return;const e=Q||R[I];e&&be(x.sourceIdx,x.candidateWord,x.contextIndices,e,x.isFinal)}function St(){q&&(q.style.display="none"),y&&(y.style.visibility="visible"),S&&(S.style.display="block")}const Re=24;function It(){C.push(Date.now()),C.length>Re&&C.splice(0,C.length-Re)}function Tt(){if(C.length<3)return 0;const e=[];for(let s=1;s<C.length;s+=1){const r=C[s]-C[s-1];r>0&&e.push(r)}if(e.length===0)return 0;const t=[...e].sort((s,r)=>s-r),n=t[Math.floor(t.length/2)],i=Math.max(n*2.5,30);let a=e.filter(s=>s<=i);a.length===0&&(a=e);const o=a.reduce((s,r)=>s+r,0);return o>0?a.length/(o/1e3):0}function Be(){const e=Tt();if(ie){const s=m.getElementById("timelineSpeedReadout");if(s){const r=e>=.05?e:H,l=Math.round(Y/H);s.textContent=l>1?`${l}x slowed down [${r.toFixed(1)} t/sec]`:`Realtime [${r.toFixed(1)} t/sec]`}return}const t={"real-time":Y,"tenth-speed":ue,"one-percent-speed":De},i=`(${(e>=.05?e:t[k]||ue).toFixed(1)} t/sec)`,a={"real-time":"wpsRealtime","tenth-speed":"wpsTenth","one-percent-speed":"wpsOnePercent"},o=m.getElementById(a[k]);o&&(o.textContent=i),["wpsRealtime","wpsTenth","wpsOnePercent"].filter(s=>s!==a[k]).forEach(s=>{const r=m.getElementById(s);r&&(r.textContent="")})}function Ce(e){const t={"real-time":Y,"tenth-speed":ue,"one-percent-speed":De};k=Object.prototype.hasOwnProperty.call(t,e)?e:Fe,H=t[k],C=[],L.classList.toggle("speed-realtime",k==="real-time"),m.querySelectorAll(".speed-nav-item").forEach(n=>{n.classList.toggle("active",n.dataset.speedMode===k)}),["wpsRealtime","wpsTenth","wpsOnePercent"].forEach(n=>{const i=m.getElementById(n);i&&n!=={"real-time":"wpsRealtime","tenth-speed":"wpsTenth","one-percent-speed":"wpsOnePercent"}[k]&&(i.textContent="")})}function At(){const e=m.getElementById("timelineSpeedSlider"),t=m.querySelector(".speed-timeline-thumb");if(!e||!t)return;const n=parseFloat(e.min),i=parseFloat(e.max),a=i-n,o=a>0?(D(parseFloat(e.value),n,i)-n)/a:0;t.style.left=`${o*100}%`}function G(e,t=!0){const n=D(e,ut,ft);H=n,k=n>=17?"real-time":"slow-motion",L.classList.toggle("speed-realtime",k==="real-time"),C=[];const i=m.getElementById("timelineSpeedReadout");if(i){const a=Math.round(Y/n);i.textContent=a>1?`${a}x slowed down [${n.toFixed(1)} t/sec]`:`Realtime [${Math.round(n)} t/sec]`}if(t){const a=m.getElementById("timelineSpeedSlider");a&&(a.value=String(vt(n)))}At()}function Pt(e){ie=e,L.classList.toggle("timeline-mode",e);const t=m.querySelector(".speed-nav-timeline");t&&t.setAttribute("aria-hidden","false");{const n=m.getElementById("timelineSpeedSlider"),i=n?parseInt(n.value,10):NaN,a=Number.isFinite(i)?i:Ee;G(V(a),!0)}}function Lt(){m.querySelectorAll(".speed-nav-item").forEach(t=>{t.addEventListener("click",()=>{if(ie)return;const n=t.dataset.speedMode;n&&Ce(n)})}),O&&clearInterval(O),O=setInterval(Be,100);const e=m.getElementById("timelineSpeedSlider");e&&e.addEventListener("input",()=>{const t=parseInt(e.value,10);G(V(Number.isFinite(t)?t:Ee),!1)}),m.querySelectorAll(".speed-timeline-end").forEach(t=>{t.addEventListener("click",()=>{const n=m.getElementById("timelineSpeedSlider");if(!n)return;const i=parseInt(n.min,10),a=parseInt(n.max,10),o=t.dataset.timelineEnd==="max"?a:i;if(parseInt(n.value,10)===o)return;n.value=String(o);const s=m.querySelector(".speed-timeline-thumb");if(s){s.classList.add("thumb-slam");const r=()=>{s.classList.remove("thumb-slam"),s.removeEventListener("transitionend",r)};s.addEventListener("transitionend",r)}G(V(o),!1)})}),ie?G(V(wt()),!0):(G(V(0),!0),Ce(Fe))}function Rt(){y&&(z.length>0&&Ue(Ge()),[y,q].forEach(e=>{e&&(e.classList.add("mono"),e.classList.remove("main-serif"))}),[y,q,S].forEach(e=>{e&&(e.classList.add("suggestions-anchor-bottom"),e.classList.remove("suggestions-anchor-top"))}),ae=!0,L.classList.add("paragraph-mode"),y.classList.remove("force-single-line"),y.style.justifyContent="flex-start",y.style.textAlign="left",y.style.width="100%",y.style.maxWidth="50rem",y.style.marginLeft="auto",y.style.marginRight="auto",[y,q].forEach(e=>{e&&(e.style.fontSize="14px")}),Pt(!0))}function X(e){return e.toLowerCase()}function le(e){return/^[,.;:!?]$/.test(e)}function We(e){const t=X(e);return!le(e)&&!at.has(t)&&e.length>1}function Ct(e,t){const n=R[I];return!!(n&&n.joins&&n.joins[t]==="tight"&&!le(e?e[t]:""))}function qe(){F.forEach(e=>window.clearTimeout(e)),F=[]}function $e(e){return Math.max(1,Math.round(e/H))}function _(e,t){const n=window.setTimeout(e,$e(t));return F.push(n),n}function Nt(){const e=de.min+Math.random()*(de.max-de.min),t=(o,s)=>o+Math.random()*(s-o),n=B.reduce((o,s)=>o+s.weight,0);let i=Math.random()*n,a=B[B.length-1];for(let o=0;o<B.length;o+=1)if(i-=B[o].weight,i<=0){a=B[o];break}return{thinkingDuration:Math.round(t(a.thinkingDuration[0],a.thinkingDuration[1])),thinkingTick:Math.round(t(a.thinkingTick[0],a.thinkingTick[1])*e),connectHold:Math.round(t(a.connectHold[0],a.connectHold[1])*e),pruneHold:Math.round(t(a.pruneHold[0],a.pruneHold[1])*e),finalHold:Math.round(t(a.finalHold[0],a.finalHold[1])*e),nextWordPause:Math.round(t(a.nextWordPause[0],a.nextWordPause[1])*e),nonContentPause:Math.max(10,Math.round(t(a.nonContentPause[0],a.nonContentPause[1])*e))}}function W(){$.innerHTML="",x=null}function _t(e,t,n,i=0){return Math.min(e,t)-n*.2-46-i}function Yt(){if(!S)return{minY:1/0,maxY:-1/0};const e=Array.from(S.querySelectorAll("[data-token-hint]"));if(e.length===0)return{minY:1/0,maxY:-1/0};let t=1/0,n=-1/0;return e.forEach(i=>{const a=A(i);t=Math.min(t,a.top),n=Math.max(n,a.bottom)}),{minY:t,maxY:n}}function Ot(){const e=Array.from(m.querySelectorAll("#sentence-container .token-wrapper .token"));if(e.length===0)return{minY:1/0,maxY:-1/0};let t=1/0,n=-1/0,i=1/0,a=-1/0;return e.forEach(o=>{const s=A(o);t=Math.min(t,s.left),n=Math.max(n,s.right),i=Math.min(i,s.top),a=Math.max(a,s.bottom)}),{minX:t,maxX:n,minY:i,maxY:a}}function Dt(){const e=Array.from(m.querySelectorAll("#sentence-container .token-wrapper .weight-label"));if(e.length===0)return{minY:1/0,maxY:-1/0};let t=1/0,n=-1/0;return e.forEach(i=>{const a=A(i);t=Math.min(t,a.top),n=Math.max(n,a.bottom)}),{minY:t,maxY:n}}function He(e,t,n,i,a){const o=s=>Math.round(s)+.5;return`M ${o(e)} ${o(t)} V ${o(n)} H ${o(i)} V ${o(a)}`}function Ft(){if(!y)return null;const e=Array.from(y.querySelectorAll(".token-wrapper"));if(e.length===0)return null;const t=e.map(o=>A(o)).filter(o=>o&&Number.isFinite(o.top)&&Number.isFinite(o.bottom)).sort((o,s)=>o.top-s.top);if(t.length===0)return null;const n=[],i=12;if(t.forEach(o=>{const s=(o.top+o.bottom)/2,r=n[n.length-1];if(!r){n.push({top:o.top,bottom:o.bottom,centerY:s});return}if(Math.abs(s-r.centerY)<=i){r.top=Math.min(r.top,o.top),r.bottom=Math.max(r.bottom,o.bottom),r.centerY=(r.top+r.bottom)/2;return}n.push({top:o.top,bottom:o.bottom,centerY:s})}),n.length===0)return null;const a=[];for(let o=0;o<n.length-1;o+=1)a.push((n[o].bottom+n[o+1].top)/2);return{bands:n,gapCenters:a}}function zt(e,t){const n=j(e);if(!n||!t||t.length===0)return 0;const i=A(n),a=(i.top+i.bottom)/2;let o=0,s=1/0;return t.forEach((r,l)=>{const d=Math.abs(a-r.centerY);d<s&&(s=d,o=l)}),o}function je(e,t,n,i=0){let o=_t(e,t,n,i);if(y.classList.contains("suggestions-anchor-top")){const r=Yt();r.minY!==1/0&&o>=r.minY-30&&o<=r.maxY+30&&(o=r.minY-30-20)}const s=Ot();return Dt(),s.minY!==1/0&&(o=Math.min(o,s.minY-60)),o}function Se(e){return e.top-10}function Xe(e){const t=j(e);if(!t||!Et(e))return null;const n=A(t),i=n.left+n.width/2;let a=Se(n);if(y.classList.contains("suggestions-anchor-top")&&S){const o=S.querySelector(`[data-token-hint="${e}"]`);o&&(a=A(o).top)}return{startX:i,startY:a}}function Bt(){if(!x||!x.paths||x.paths.length===0||!y.classList.contains("suggestions-anchor-top"))return;const e=Xe(x.sourceIdx);e&&x.paths.forEach(t=>{const n=j(t.tokenIdx);if(!n)return;const i=A(n),a=i.left+i.width/2,o=Se(i),s=Math.abs(a-e.startX),r=t.laneOffset||0,l=je(e.startY,o,s,r),d=He(e.startX,e.startY,l,a,o);t.pathEl.setAttribute("d",d)})}function Ve(){const e=J.get(P+1);return!e||!Array.isArray(e.attention)?[]:e.attention.map(t=>t.i).filter(t=>Number.isFinite(t)&&t>=0&&t<=P)}function Wt(e){if(z=(Array.isArray(e&&e.paragraphs)?e.paragraphs:e&&Array.isArray(e.tokens)?[e]:[]).filter(n=>n&&Array.isArray(n.tokens)&&Array.isArray(n.steps)),z.length===0)throw new Error("dataset has no valid paragraph traces")}async function Ne(e){const t=await fetch(e);if(!t.ok)throw new Error(`HTTP ${t.status}`);return t.json()}async function qt(){try{let e;if(fe)e=await Ne(fe);else if(me)e=me;else{if(typeof window<"u"&&window.location.protocol==="file:")throw new Error("no dataset available over file: protocol");e=await Ne(it)}Wt(e)}catch(e){z=[],console.warn("Failed to load paragraph dataset.",e)}}function Ge(){const e=z.length;if(e<=1)return 0;let t=ge;for(;t===ge;)t=Math.floor(Math.random()*e);return t}function Ue(e){const t=z[e];if(!t)return;ge=e;const n=t.tokens.map(o=>String(o&&o.token||"")),i=t.tokens.map(o=>o&&o.join||"space");pe=Array.isArray(t.steps)?t.steps:[],J=new Map,pe.forEach(o=>{o&&Number.isFinite(o.selected)&&J.set(o.selected,o)}),R=[{words:n,joins:i}],I=0;const a=new Set;pe.forEach(o=>{(o.candidates||[]).forEach(s=>{const r=String(s&&s.token||"").trim();r&&We(r)&&a.add(r)})}),ze=Array.from(a)}function $t(){z.length>0&&Ue(Ge()),P=-1,Te()}function Ht(e,t){const n=e.words[t],i=J.get(t),a=Ve(),o=a.map(r=>({idx:r,word:ye[r]||e.words[r],distance:t-r}));let s;return i&&Array.isArray(i.candidates)&&i.candidates.length>0?s=i.candidates.map(r=>({word:String(r&&r.token||"").trim(),weight:Math.max(0,Number(r&&r.p)||0),selected:!!(r&&r.selected)})):s=[{word:n,weight:1,selected:!0}],{targetWord:n,contextIndices:a,contextEntries:o,candidates:s}}function jt(e,t=12){const n=new Set(e.map(s=>X(s.word))),i=ze.filter(s=>!n.has(X(s))),o=_e(i,Math.max(0,t-e.length)).map((s,r)=>({word:s,weight:Math.max(.01,.09-r*.01),selected:!1}));return _e([...e,...o],t+e.length).slice(0,Math.max(e.length,t))}function _e(e,t){const n=[...e],i=[],a=Math.max(0,Math.min(t,n.length));for(;i.length<a&&n.length>0;){const o=Math.floor(Math.random()*n.length);i.push(n[o]),n.splice(o,1)}return i}function D(e,t,n){return Math.max(t,Math.min(n,e))}function Xt(e){const t=xt();if(!t)return;t.innerHTML="",t.style.transform="translateX(0px)",xe[I]=0;let n=null;e.words.forEach((i,a)=>{((e.joins&&e.joins[a]||"space")!=="tight"||!n)&&(n=document.createElement("div"),n.className="word-group",n.style.marginRight="0.28em",t.appendChild(n));const s=document.createElement("div");s.className="token-wrapper",s.id=`token-wrapper-${a}`,s.style.margin="0",le(i)&&s.classList.add("is-punctuation");const r=document.createElement("span");r.className="token",r.id=`token-${a}`,r.textContent=i,s.appendChild(r),n.appendChild(s),s.style.opacity="0",s.style.transform="translate3d(0, 4px, 0) scale(0.99)"})}function Vt(e){if(!S)return null;let t=S.querySelector(`[data-token-hint="${e}"]`);return t||(t=document.createElement("div"),t.className="predictor-hint mono",t.setAttribute("data-token-hint",String(e)),S.appendChild(t)),t}function Ke(e,t){const n=Z(t);if(!e||!n)return;const i=A(n),a=getComputedStyle(L),o=parseFloat(a.getPropertyValue("--suggestion-offset-x"))||0;e.style.left="0px",e.style.top="0px";const s=A(e),r=8,l=11;let d=i.left+o,v=i.top+i.height/2-l;const E=Math.max(r,L.clientWidth-s.width-r),b=Math.max(r,L.clientHeight-s.height-r),g=d;d=D(d,r,E),v=D(v,r,b),e.style.left=`${d}px`,e.style.top=`${v}px`;const h=e.querySelector(".predictor-stage");if(h)if(g>E+.5){const w=Math.min(i.right+6,L.clientWidth-r-72);h.style.transform=`translateX(${Math.max(0,Math.round(w-d))}px)`}else h.style.transform=""}function Gt(){S&&S.querySelectorAll("[data-token-hint]").forEach(e=>{const t=parseInt(e.getAttribute("data-token-hint")||"",10);Number.isNaN(t)||Ke(e,t)})}function Je(){S&&(S.innerHTML="")}function Ut(e,t){if(!e||t.size===0)return;const n=[];e.querySelectorAll(".predictor-option[data-row-key]").forEach(i=>{const a=i.getAttribute("data-row-key")||"";if(!a||!t.has(a))return;const o=A(i).top,r=t.get(a)-o;Math.abs(r)<.5||n.push({row:i,deltaY:r,newTop:o})}),n.length!==0&&n.sort((i,a)=>i.newTop-a.newTop).forEach((i,a)=>{const{row:o,deltaY:s}=i,r=3,l=Math.floor(a/r),d=a%r,E=(s>=0?1:-1)*(6-d*1.5),b=l*95+d*22;o.animate([{transform:`translate(${E}px, ${s}px)`},{transform:`translate(${E*.45}px, ${s*.62}px)`},{transform:`translate(${E*.18}px, ${s*.28}px)`},{transform:"translate(0px, 0px)"}],{duration:340,delay:b,easing:"cubic-bezier(0.2, 0.8, 0.2, 1)",offsets:[0,.4,.72,1]})})}function he(e,t,n,i=[],a={}){const o=Z(e);if(!o)return;o.classList.add("predicting"),o.style.opacity="1",o.style.transform="translate3d(0, 0, 0) scale(1)";const s=Vt(e);if(!s)return;const r=String(n||"")==="SORTING",l=new Map;r&&s.querySelectorAll(".predictor-option[data-row-key]").forEach(b=>{const g=b.getAttribute("data-row-key")||"";g&&l.set(g,A(b).top)});const d=String(n||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");let v=i.slice(-300);(String(n||"")==="SORTING"||String(n||"")==="ASSIGN")&&(v=[...v].sort((b,g)=>{const h=b&&typeof b=="object"&&typeof b.weight=="number"?b.weight:-1/0;return(g&&typeof g=="object"&&typeof g.weight=="number"?g.weight:-1/0)-h}),S&&S.classList.contains("suggestions-anchor-bottom")&&v.reverse());const E=v.map((b,g,h)=>{const f=typeof b=="string"?{word:b,weight:null,selected:!1}:b,w=String(f.word||"").replace(/</g,"&lt;").replace(/>/g,"&gt;"),c=X(String(f.word||"")),p=typeof f.weight=="number"?`<span class="predictor-weight">${f.weight.toFixed(2)}</span>`:"",u=f.selected?" predictor-option-selected":"";return`<div class="predictor-option ${g===h.length-1?"is-new":""}${u}" data-row-key="${c}"><span>${w}</span>${p}</div>`}).join("");s.innerHTML=`
        <div class="predictor-stage">${d}</div>
        <div class="predictor-stack">${E}</div>
    `,s.style.visibility=a.hidden?"hidden":"visible",Ke(s,e),Q||R[I],r&&Ut(s,l),y.classList.contains("suggestions-anchor-top")&&x&&x.sourceIdx===e&&Bt()}function U(e,t){const i=(xe[I]||0)+e,a=m.getElementById(`token-wrapper-${i}`),o=m.getElementById(`token-${i}`);if(!a||!o)return;t&&(o.textContent=t,ye[e]=t),Q||R[I],a.classList.remove("predicting");const s=S?S.querySelector(`[data-token-hint="${e}"]`):null;s&&s.remove(),a.style.opacity="1",a.style.transform="translate3d(0, 0, 0) scale(1)",It(),requestAnimationFrame(()=>{y.scrollTop=y.scrollHeight})}function Ie(){m.querySelectorAll(".weight-label").forEach(e=>e.remove())}function Kt(e,t){const n=D(t,0,1),i=parseFloat(e.dataset.currentValue||"0")||0;if(Math.abs(n-i)<.004){e.textContent=n.toFixed(2),e.dataset.currentValue=n.toFixed(4);return}e.__weightRafId&&cancelAnimationFrame(e.__weightRafId);const a=220,o=performance.now(),s=r=>{const l=D((r-o)/a,0,1),d=1-Math.pow(1-l,3),v=i+(n-i)*d;if(e.textContent=v.toFixed(2),e.dataset.currentValue=v.toFixed(4),l<1){e.__weightRafId=requestAnimationFrame(s);return}e.textContent=n.toFixed(2),e.dataset.currentValue=n.toFixed(4),e.__weightRafId=null};e.__weightRafId=requestAnimationFrame(s)}function te(e){const t=Array.isArray(e)?e:[];if(t.length===0){Ie();return}const n=new Set(t.map(i=>Me(i.tokenIdx)));m.querySelectorAll(".token-wrapper .weight-label").forEach(i=>{const a=i.parentElement;if(!a||!a.id||!a.id.startsWith("token-wrapper-")){i.remove();return}const o=parseInt(a.id.replace("token-wrapper-",""),10);(Number.isNaN(o)||!n.has(o))&&i.remove()}),t.forEach(i=>{const a=Z(i.tokenIdx);if(!a)return;let o=a.querySelector(".weight-label");o||(o=document.createElement("span"),o.className="weight-label",a.appendChild(o)),Kt(o,i.weight||0)})}function Jt(e,t,n,i,a=!1){const o=J.get(e),s=o&&Array.isArray(o.attention)?o.attention:[],r=new Map;return s.forEach(l=>{const d=Number(l&&l.i);if(!Number.isFinite(d)||d<0||d>=e)return;const v=Math.max(0,Number(l&&l.score)||0),E=r.get(d);(!E||v>E.weight)&&r.set(d,{tokenIdx:d,weight:v})}),Array.from(r.values())}const ne=new Map,ve=new Map;function Ye(e){const t=e.match(/-?[\d.]+/g);return t&&t.length>=5?t.map(Number):null}function oe(e){e.forEach(t=>{const n=Z(t);if(!n)return;ne.has(n)?clearTimeout(ne.get(n)):n.classList.add("connection-flash");const i=k==="real-time"?Math.max(60,ke):Math.max(16,Math.round(420/H)),a=window.setTimeout(()=>{n.classList.remove("connection-flash"),ne.delete(n);const o=F.indexOf(a);o!==-1&&F.splice(o,1)},i);ne.set(n,a),F.push(a)})}function Qt(e,t){const n=c=>Math.round(c)+.5,i=Ft(),a=i?i.bands:null,o=c=>a?zt(c,a):0,s=j(e);if(!s)return"";const r=A(s),l=r.left+r.width/2,d=2,v=r.top,E=new Map,b=(c,p)=>{E.has(c)||E.set(c,{ticks:[],minTop:p});const u=E.get(c);return u.minTop=Math.min(u.minTop,p),u};b(o(e),v),t.forEach(({link:c,endX:p})=>{const u=j(c.tokenIdx);if(!u)return;const M=A(u).top;b(o(c.tokenIdx),M).ticks.push({x:p,top:M})});const g=5;let h=1/0;E.forEach(c=>{c.railY=c.minTop-g,h=Math.min(h,c.railY)});let f=`M ${n(l)} ${n(v-d)} V ${n(h)} `,w="";return E.forEach(c=>{const p=c.ticks.map(T=>T.x),u=Math.min(l,...p.length?p:[l]),M=Math.max(l,...p.length?p:[l]);f+=`M ${n(u)} ${n(c.railY)} H ${n(M)} `,c.ticks.forEach(T=>{w+=`M ${n(T.x)} ${n(c.railY)} V ${n(T.top-d)} `})}),{railsD:f,ticksD:w}}function be(e,t,n,i,a,o=null){o||x&&x.seqIndex===I&&x.sourceIdx===e&&x.renderOptions&&x.renderOptions;const s=new Map;k==="real-time"&&x&&x.paths&&x.paths.forEach(g=>{const h=g.pathEl.getAttribute("d");h&&s.set(g.tokenIdx,h)});let r=null;k==="real-time"?(r=Array.from($.querySelectorAll(".attention-line")),x=null):W();const l=Xe(e);if(!l)return[];const d=Jt(e,t,n,i,!1),v=[],E=[],b=[];if(d.forEach(g=>{const h=j(g.tokenIdx);if(!h)return;const f=A(h),w=f.left+f.width/2,c=Se(f);b.push({link:g,endX:w,endY:c})}),ae){const{railsD:g,ticksD:h}=Qt(e,b),f=(w,c)=>{if(!w)return;const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",w),p.setAttribute("class",`attention-line ${c}`),p.setAttribute("stroke-opacity","0.72"),k==="real-time"&&(p.style.animation="none",p.style.strokeDasharray="none",p.style.strokeDashoffset="0"),$.appendChild(p),p.setAttribute("data-rt-birth",String(Date.now())),E.push({tokenIdx:-1,pathEl:p,laneOffset:0,weight:0})};f(g,"attention-rail"),f(h,"attention-tick"),b.forEach(({link:w})=>v.push(w.tokenIdx))}else{const g=b.sort((u,M)=>u.endX-M.endX),h=y.classList.contains("suggestions-anchor-top"),f=12,w=6;let c=0,p=null;g.forEach(u=>{const{link:M,endX:T,endY:ee}=u;p!==null&&Math.abs(T-p)>w&&(c+=1);const Pe=h?c*f:0;p=T;const tt=Math.abs(T-l.startX),nt=je(l.startY,ee,tt,Pe),ce=He(l.startX,l.startY,nt,T,ee),N=document.createElementNS("http://www.w3.org/2000/svg","path");if(N.setAttribute("d",ce),N.setAttribute("class","attention-line"),N.setAttribute("stroke-opacity","0.72"),k==="real-time"&&(N.style.animation="none",N.style.strokeDasharray="none",N.style.strokeDashoffset="0"),$.appendChild(N),N.setAttribute("data-rt-birth",String(Date.now())),k==="real-time"){const Le=s.get(M.tokenIdx)||ve.get(M.tokenIdx);Ye(ce),Le&&Ye(Le),ve.set(M.tokenIdx,ce)}E.push({tokenIdx:M.tokenIdx,pathEl:N,laneOffset:Pe,weight:M.weight}),v.push(M.tokenIdx)})}return r&&(k!=="real-time"||ke===0)&&r.forEach(g=>{g.parentNode&&g.remove()}),x={sourceIdx:e,candidateWord:t,contextIndices:[...n],links:d.map(g=>({tokenIdx:g.tokenIdx,weight:g.weight})),paths:E,seqIndex:I,isFinal:a},d}function Zt(e){for(P=-1;P+1<e.words.length&&P+1<rt;)P+=1,U(P,e.words[P])}function K(){const e=Q||R[I];if(!e)return;const t=Nt(),n=P+1;if(n>=e.words.length){k!=="real-time"&&W(),k==="real-time"&&(W(),Ie());const h=k==="real-time"?1500:$e(st.sentencePause),f=window.setTimeout(()=>{$t()},h);F.push(f);return}const i=e.words[n],a=Ct(e.words,n);if(le(i)){P=n,U(n,i),_(K,100);return}if(!We(i)){k!=="real-time"&&W(),P=n,U(n,i),_(K,t.nonContentPause);return}if(k==="real-time"){Je();const h=Ve(),f=be(n,i,h,e,!0);te(f);const w=[...new Set(f.map(c=>c.tokenIdx))];w.length>0&&oe(w);{const c=Date.now()-ke;$.querySelectorAll(".attention-line").forEach(p=>{const u=parseInt(p.getAttribute("data-rt-birth")||"0",10);u>0&&u<c&&p.parentNode&&p.remove()})}_(()=>{P=n,U(n,i),_(K,Math.max(4,Math.round(t.nextWordPause*.2)))},Math.max(4,Math.round(t.finalHold*.1)));return}const o=Ht(e,n),s=jt(o.candidates,12);let r=null,l=[],d=!1;const v=(h,f=!1)=>{if(!r){const w=f||k==="real-time";r=be(n,h||i,o.contextIndices,e,w,null),l=[...new Set(r.map(p=>p.tokenIdx))]}return r},E=h=>{const f=Math.max(t.finalHold,520),w=X(i),c=h.map(u=>({word:u.word,weight:u.weight,selected:u.selected||X(u.word)===w}));he(n,i,"ASSIGN",c);const p=v(i);te(p),!d&&l.length>0&&(oe(l),d=!0),_(()=>{P=n,U(n,i),_(()=>{k!=="real-time"&&W(),_(K,t.nextWordPause)},ct)},f)},b=()=>{const h=Math.max(t.connectHold,700),f=[...o.candidates].sort((u,M)=>M.weight-u.weight).map(u=>({word:u.word,weight:u.weight,selected:u.selected})),w=f.map(u=>({word:u.word,weight:u.weight,selected:!1})),c=f[0]?.word||i;he(n,c,"SORTING",w,{hidden:!1});const p=v(c);te(p),!d&&l.length>0&&(oe(l),d=!0),_(()=>E(f),h)};(()=>{const h=s.map(T=>({word:T.word,weight:T.weight})),f=a?Math.max(320,Math.round(t.thinkingDuration*.82)):t.thinkingDuration,w=[],c=Math.max(1,h.length),p=D(Math.round(f/c),45,260);let u=0;const M=()=>{const T=h[u]||h[h.length-1]||{word:i,weight:1};w.push(T),he(n,T.word,"THINKING",w);const ee=v(T.word);if(te(ee),!d&&l.length>0&&(oe(l),d=!0),u+=1,u>=c){b();return}_(M,p)};M()})()}function Te(){qe(),W(),Je(),Ie(),ve.clear(),St(),we&&(we.innerHTML="");const e=lt(I),t=e.seq||{words:[]};Q=t,e.step,ye=[...t.words],I===0&&(xe={}),Xt(t),Zt(t),K()}function en(){Gt(),Mt()}let Ae=!1,re=!1;async function tn(e,t,n={}){m=e,L=t,n.src&&(fe=n.src),n.data&&(me=n.data),bt(),window.addEventListener("resize",en),await qt(),Rt(),Lt(),Ae=!0,Te()}function Oe(){re||!Ae||(re=!0,qe(),O&&(clearInterval(O),O=null))}function nn(){!re||!Ae||(re=!1,O||(O=setInterval(Be,100)),Te())}const on="/data/self-attention/paragraph_traces_v5.json",an=`
<div class="app-shell">
  <svg id="attention-canvas" aria-hidden="true"></svg>
  <div id="suggestion-layer" class="suggestion-layer suggestions-anchor-bottom" aria-hidden="true"></div>
  <div id="adventure-layer" aria-hidden="true">
    <div id="adventure-anchor-line"></div>
    <div id="adventure-stage">
      <div id="adventure-content"></div>
    </div>
  </div>

  <main class="app-main">
    <!-- No aria-live/role=log: the engine appends decoratively-generated tokens continuously, which
         would flood screen readers with meaningless partial text. The visual is decorative — the page's
         real heading/intro are exposed via .sr-only in the homepage route. -->
    <div id="sentence-container" class="mono sentence-display"></div>
  </main>

  <div id="speed-nav" aria-label="Speed mode">
    <div class="speed-nav-standard">
      <div class="speed-nav-title">Self-attention in transformers</div>
      <button class="speed-nav-item" data-speed-mode="real-time" type="button">↳ Realtime <span class="speed-nav-wps" id="wpsRealtime"></span></button>
      <button class="speed-nav-item active" data-speed-mode="tenth-speed" type="button">↳ 30x slowed down <span class="speed-nav-wps" id="wpsTenth"></span></button>
      <button class="speed-nav-item" data-speed-mode="one-percent-speed" type="button">↳ 150x slowed down <span class="speed-nav-wps" id="wpsOnePercent"></span></button>
    </div>
    <div class="speed-nav-timeline" aria-hidden="true">
      <div class="speed-timeline-readout" id="timelineSpeedReadout">30x slowed down [6.4 t/sec]</div>
      <div class="speed-timeline-track-row">
        <input id="timelineSpeedSlider" class="speed-timeline-slider" type="range" min="0" max="6" step="1" value="3" aria-label="Timeline speed">
        <!-- Visible thumb is this overlay (the native one is hidden) so it can ease
             between steps; positioned by JS, the native input drives interaction. -->
        <span class="speed-timeline-thumb" aria-hidden="true"></span>
      </div>
      <div class="speed-timeline-ends-below">
        <button class="speed-timeline-end" data-timeline-end="min" type="button">Detailed</button>
        <button class="speed-timeline-end" data-timeline-end="max" type="button">Realtime</button>
      </div>
    </div>
  </div>
</div>
`;class Qe extends HTMLElement{booted=!1;onscreen=!0;observer;onVisibility=()=>this.syncRun();connectedCallback(){if(this.booted)return;this.booted=!0;const t=this.attachShadow({mode:"open"}),n=document.createElement("style");n.textContent=ot,t.appendChild(n);const i=document.createElement("div");i.innerHTML=an.trim();const a=i.firstElementChild;t.appendChild(a);const o=this.getAttribute("src")||on;tn(t,a,{src:o}).then(()=>this.startLifecycle())}disconnectedCallback(){this.observer?.disconnect(),this.observer=void 0,document.removeEventListener("visibilitychange",this.onVisibility),Oe()}startLifecycle(){this.observer=new IntersectionObserver(t=>{this.onscreen=t.some(n=>n.isIntersecting),this.syncRun()},{threshold:0}),this.observer.observe(this),document.addEventListener("visibilitychange",this.onVisibility),this.syncRun()}syncRun(){this.onscreen&&!document.hidden?nn():Oe()}}function Ze(e="self-attention"){typeof customElements<"u"&&!customElements.get(e)&&customElements.define(e,Qe)}Ze();const rn=Object.freeze(Object.defineProperty({__proto__:null,SelfAttentionElement:Qe,defineSelfAttention:Ze},Symbol.toStringTag,{value:"Module"})),et="/data/self-attention/paragraph_traces_v5.json";function sn(e){const t=document.createElement("self-attention");return t.setAttribute("src",et),t.style.display="block",t.style.width="100%",t.style.height="100%",e.appendChild(t),{transitionOut:()=>Promise.resolve(),destroy:()=>{t.remove()}}}const ln=Object.freeze(Object.defineProperty({__proto__:null,SELF_ATTENTION_DATA_URL:et,initSelfAttention:sn},Symbol.toStringTag,{value:"Module"}));export{et as S,rn as e,ln as i};
