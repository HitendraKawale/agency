/**
 * Row switching, the "1820" background transition and the 20 s autoplay,
 * ported from reference/lebedev/js/inline/15_at144027.js (CMS v70). Constants,
 * keyframes, the queued-switch rules (last click wins), the elapsed-time
 * readback and the negative-animation-delay resume are theirs. React renders
 * the DOM; this module owns the state classes on it (is-active, is-entering,
 * is-leaving, is-autoplay-*), which is why the markup never changes them.
 *
 * Differences from the source, all deliberate:
 * - Plain MP4 per item instead of hls.js, so "warming" sets `src` on the
 *   active item and its neighbours instead of calling decoder-video.js.
 * - Their .overlay_slightly stabiliser and the unused clearActive/fade path
 *   are not ported (the overlay is forced transparent in their CSS).
 * - Wake after a hidden tab resumes the row at its captured elapsed time
 *   (their runAutoplayUI elapsedMs branch). Their visibilitychange handler
 *   restarts the fill from zero; the resume branch exists but only the
 *   carousel reaches it.
 */

// Theirs is brightness(0.78) over night footage. Ours are light websites, so
// white rows need a darker, less saturated ground to stay readable.
const VIDEO_DARKEN_FILTER = "brightness(0.42) saturate(0.6)";
const VIDEO_ENTER_FROM_FILTER = VIDEO_DARKEN_FILTER + " grayscale(100%) blur(10px)";

const AUTOPLAY_MS = 20000;
const MOBILE_MQ = "(max-width: 991px)";
const SWIPE_MIN_PX = 48;
const SWIPE_MAX_MS = 700;

const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EXPO_IN_OUT = "cubic-bezier(0.87, 0, 0.13, 1)";
const ENTER_MS = 2000;
const LEAVE_MS = 1100;
const LEAVE_CLIP_MS = 1000;
const SLIDE_MS = ENTER_MS;
const ENTER_SCALE = 1.3;
const ENTER_ROTATE = 4;
const LEAVE_SHIFT_Y = -125;

const SWITCH_CLASSES = ["is-leaving", "is-entering", "is-slide-in", "is-slide-out"] as const;

type Pair = { index: number; item: HTMLElement; row: HTMLElement; src: string | null };

type Pending = { targetItem: HTMLElement; onDone: () => void };

type ActiveTransition = {
  prevItem: HTMLElement | null;
  nextItem: HTMLElement;
  gen: number;
  onDone: () => void;
};

type PausedAutoplay = { index: number; elapsedMs: number };

export type StageOptions = {
  bg: HTMLElement;
  /** Element the mobile swipe listens on (their SCOPE, .features_hero). */
  swipeRoot: HTMLElement;
  items: HTMLElement[];
  rows: HTMLElement[];
  /** Video sources per item, null when no clip exists. */
  sources: ReadonlyArray<string | null>;
  /**
   * Called when the already-active row is clicked, with the click target.
   * Return true to skip restarting the autoplay (used to open a case study).
   */
  onActiveRowClick?: (index: number, target: Element) => boolean;
};

function getVideo(item: HTMLElement | null) {
  return item?.querySelector("video") ?? null;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function enterTransform() {
  return "rotate(" + ENTER_ROTATE + "deg) scale(" + ENTER_SCALE + ")";
}

function prepareVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
}

function playVideoEl(video: HTMLVideoElement | null) {
  if (!video || !video.getAttribute("src")) return;
  prepareVideo(video);
  if (!video.paused && video.readyState >= 2) return;
  video.play().catch(() => {});
}

function pauseItemVideos(item: HTMLElement | null) {
  if (!item) return;
  item.querySelectorAll("video").forEach((video) => {
    if (!video.paused) video.pause();
  });
}

function cancelItemAnimations(item: HTMLElement | null) {
  if (!item) return;
  item.getAnimations().forEach((anim) => anim.cancel());
  item.querySelectorAll("video").forEach((video) => {
    video.getAnimations().forEach((anim) => anim.cancel());
  });
}

function resetVideoStyles(item: HTMLElement | null) {
  if (!item) return;
  cancelItemAnimations(item);
  item.style.transform = "";
  item.style.transformOrigin = "";
  item.style.clipPath = "";
  item.style.filter = "";
  item.style.willChange = "";
  item.querySelectorAll("video").forEach((video) => {
    video.style.transform = "";
    video.style.opacity = "";
    video.style.filter = "";
    video.style.clipPath = "";
  });
  item.classList.remove("is-slide-in", "is-slide-out");
}

function commitSwitchEndStyles(prevItem: HTMLElement | null, nextItem: HTMLElement) {
  if (prevItem) {
    prevItem.style.clipPath = "inset(0% 0% 100% 0%)";
    const prevVideo = getVideo(prevItem);
    if (prevVideo) prevVideo.style.transform = "translate3d(0, " + LEAVE_SHIFT_Y + "px, 0)";
  }
  nextItem.style.transform = "rotate(0deg) scale(1)";
  const nextVideo = getVideo(nextItem);
  if (nextVideo) nextVideo.style.filter = VIDEO_DARKEN_FILTER;
}

/** WAAPI keyframes of the 1820 transition, verbatim from run1820Transition. */
function run1820Transition(prevItem: HTMLElement | null, nextItem: HTMLElement | null) {
  const prevVideo = prevItem ? getVideo(prevItem) : null;
  const anims: Animation[] = [];
  const enterFrom = enterTransform();

  if (prevItem && prevItem.animate) {
    prevItem.style.clipPath = "inset(0% 0% 0% 0%)";
    anims.push(
      prevItem.animate([{ clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)" }], {
        duration: LEAVE_CLIP_MS,
        easing: EXPO_IN_OUT,
        fill: "forwards",
      }),
    );
  }

  if (prevVideo && prevVideo.animate) {
    prevVideo.style.transform = "translate3d(0, 0, 0)";
    anims.push(
      prevVideo.animate(
        [{ transform: "translate3d(0, 0, 0)" }, { transform: "translate3d(0, " + LEAVE_SHIFT_Y + "px, 0)" }],
        { duration: LEAVE_MS, easing: EXPO_IN_OUT, fill: "forwards" },
      ),
    );
  }

  if (nextItem && nextItem.animate) {
    const nextVideo = getVideo(nextItem);
    nextItem.style.transformOrigin = "center center";
    nextItem.style.transform = enterFrom;
    anims.push(
      nextItem.animate([{ transform: enterFrom }, { transform: "rotate(0deg) scale(1)" }], {
        duration: ENTER_MS,
        easing: EXPO_OUT,
        fill: "forwards",
      }),
    );
    if (nextVideo && nextVideo.animate) {
      nextVideo.style.filter = VIDEO_ENTER_FROM_FILTER;
      anims.push(
        nextVideo.animate([{ filter: VIDEO_ENTER_FROM_FILTER }, { filter: VIDEO_DARKEN_FILTER }], {
          duration: ENTER_MS,
          easing: EXPO_OUT,
          fill: "forwards",
        }),
      );
    }
  }

  return anims;
}

/** Starts the stage. Returns a destroy function and a manual `goTo`. */
export function createStageController(options: StageOptions) {
  const { bg, swipeRoot, items, rows, sources, onActiveRowClick } = options;

  const pairs: Pair[] = items.map((item, index) => ({
    index,
    item,
    row: rows[index] as HTMLElement,
    src: sources[index] ?? null,
  }));
  if (!pairs.length) return { destroy() {}, goTo(_index: number) {} };

  let switching = false;
  let switchGen = 0;
  let slideTimer: number | null = null;
  let switchAnims: Animation[] = [];
  let pendingSwitch: Pending | null = null;
  let currentEnteringItem: HTMLElement | null = null;
  let activeTransition: ActiveTransition | null = null;

  let currentIndex = 0;
  let autoplayTimer: number | null = null;
  let autoplayDeadline = 0;
  let autoplayPause: PausedAutoplay | null = null;

  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;

  const mobileMq = window.matchMedia(MOBILE_MQ);

  /* ---------- video warming (replaces decoder-video.js) ---------- */

  function warmItem(pair: Pair | undefined) {
    if (!pair) return;
    const video = getVideo(pair.item);
    if (!video) return;
    prepareVideo(video);
    if (pair.src && !video.getAttribute("src")) {
      video.preload = "auto";
      video.src = pair.src;
      video.load();
    }
  }

  /** The active item plus the one on each side. */
  function warmNeighbors(index: number) {
    const n = pairs.length;
    warmItem(pairs[index]);
    warmItem(pairs[(index + 1) % n]);
    warmItem(pairs[(index - 1 + n) % n]);
  }

  function pauseAllExcept(keep: HTMLElement[]) {
    for (const item of items) {
      if (keep.indexOf(item) !== -1) continue;
      pauseItemVideos(item);
    }
  }

  function playItem(item: HTMLElement | null) {
    if (!item) return;
    pauseAllExcept([item]);
    playVideoEl(getVideo(item));
  }

  function getActiveItem() {
    return items.find((item) => item.classList.contains("is-active")) ?? null;
  }

  /* ---------- switching ---------- */

  function cleanupSwitchClasses() {
    for (const item of items) {
      item.classList.remove(...SWITCH_CLASSES);
      resetVideoStyles(item);
    }
  }

  function purgeStaleTransitionItems(keepA: HTMLElement | null, keepB: HTMLElement | null) {
    for (const item of items) {
      if (item === keepA || item === keepB) continue;
      item.classList.remove(...SWITCH_CLASSES, "is-active");
      resetVideoStyles(item);
    }
  }

  function cancelSwitchAnims() {
    switchAnims.forEach((anim) => anim.cancel());
    switchAnims = [];
  }

  function queueSwitch(targetItem: HTMLElement, onDone: () => void) {
    pendingSwitch = { targetItem, onDone };
  }

  function runPendingSwitch(fromItem: HTMLElement) {
    if (!pendingSwitch) return false;
    const pending = pendingSwitch;
    pendingSwitch = null;
    const target = pending.targetItem;
    if (target === fromItem) {
      pending.onDone();
      return false;
    }
    slideSwitch(fromItem, target, pending.onDone);
    return true;
  }

  function finishSwitch(prevItem: HTMLElement | null, nextItem: HTMLElement, gen: number, onDone: () => void) {
    if (gen !== switchGen) return;
    activeTransition = null;
    if (slideTimer) {
      clearTimeout(slideTimer);
      slideTimer = null;
    }
    if (prevItem && prevItem !== nextItem) {
      prevItem.classList.remove("is-leaving", "is-active", ...SWITCH_CLASSES.slice(1));
      resetVideoStyles(prevItem);
      pauseItemVideos(prevItem);
    }
    commitSwitchEndStyles(prevItem, nextItem);
    cancelSwitchAnims();
    if (prevItem && prevItem !== nextItem) {
      prevItem.style.clipPath = "";
      const prevVideoCleanup = getVideo(prevItem);
      if (prevVideoCleanup) prevVideoCleanup.style.transform = "";
    }
    nextItem.classList.remove("is-entering", "is-slide-in", "is-slide-out");
    nextItem.classList.add("is-active");
    resetVideoStyles(nextItem);
    bg.classList.remove("is-video-switching");
    playItem(nextItem);
    currentEnteringItem = null;
    onDone();

    const idx = items.indexOf(nextItem);
    if (idx >= 0) warmNeighbors(idx);

    if (runPendingSwitch(nextItem)) return;

    switching = false;
  }

  function slideSwitch(prevItem: HTMLElement | null, nextItem: HTMLElement, onDone: () => void) {
    if (prevItem === nextItem) {
      playItem(nextItem);
      onDone();
      return;
    }

    switching = true;
    currentEnteringItem = nextItem;
    const gen = switchGen;

    if (slideTimer) {
      clearTimeout(slideTimer);
      slideTimer = null;
    }

    purgeStaleTransitionItems(prevItem, nextItem);

    bg.classList.add("is-video-switching");

    const nextIdx = items.indexOf(nextItem);
    if (nextIdx >= 0) warmItem(pairs[nextIdx]);
    resetVideoStyles(nextItem);

    if (prevItem) {
      resetVideoStyles(prevItem);
      prevItem.classList.add("is-leaving");
      prevItem.classList.remove("is-active");
    }

    nextItem.classList.remove("is-leaving");
    nextItem.classList.add("is-entering", "is-active");
    // freezeTransitionVideos: the leaving clip stops, the entering one plays.
    pauseItemVideos(prevItem);
    playVideoEl(getVideo(nextItem));

    if (prefersReducedMotion()) {
      finishSwitch(prevItem, nextItem, gen, onDone);
      return;
    }

    const prevVideo = prevItem ? getVideo(prevItem) : null;
    const nextVideo = getVideo(nextItem);
    if (prevItem) prevItem.style.clipPath = "inset(0% 0% 0% 0%)";
    if (prevVideo) prevVideo.style.transform = "translate3d(0, 0, 0)";
    nextItem.style.transformOrigin = "center center";
    nextItem.style.transform = enterTransform();
    if (nextVideo) nextVideo.style.filter = VIDEO_ENTER_FROM_FILTER;

    requestAnimationFrame(() => {
      if (gen !== switchGen) return;
      cancelSwitchAnims();
      switchAnims = run1820Transition(prevItem, nextItem);
    });

    activeTransition = { prevItem, nextItem, gen, onDone };

    slideTimer = window.setTimeout(() => {
      slideTimer = null;
      finishSwitch(prevItem, nextItem, gen, onDone);
    }, SLIDE_MS);
  }

  function setActive(activeItem: HTMLElement) {
    const prev = getActiveItem();

    if (prev === activeItem) {
      pendingSwitch = null;
      playItem(activeItem);
      return;
    }
    if (!prev) {
      pendingSwitch = null;
      activeItem.classList.add("is-active");
      playItem(activeItem);
      return;
    }

    if (switching) {
      if (activeItem === currentEnteringItem && (!pendingSwitch || pendingSwitch.targetItem === activeItem)) {
        return;
      }
      queueSwitch(activeItem, () => {});
      return;
    }

    pendingSwitch = null;
    slideSwitch(prev, activeItem, () => {});
  }

  /* ---------- row highlight + autoplay ---------- */

  function getRowAutoplayMs(row: HTMLElement) {
    const raw =
      row.style.getPropertyValue("--autoplay-duration") ||
      window.getComputedStyle(row).getPropertyValue("--autoplay-duration");
    const sec = parseFloat(raw);
    return isFinite(sec) && sec > 0 ? sec * 1000 : AUTOPLAY_MS;
  }

  function stopAutoplayUI() {
    for (const row of rows) {
      row.classList.remove("is-autoplay-current", "is-autoplay-running", "is-autoplay-resumed");
      row.style.removeProperty("--line-fill");
      row.style.removeProperty("animation");
      const bar = row.querySelector<HTMLElement>(".pj-progress");
      if (bar) {
        bar.style.removeProperty("animation");
        bar.style.removeProperty("transform");
      }
    }
  }

  function readAutoplayElapsedMs(row: HTMLElement) {
    const durationMs = getRowAutoplayMs(row);
    const bar = row.querySelector<HTMLElement>(".pj-progress");
    if (!bar) return 0;
    const matrix = window.getComputedStyle(bar).transform;
    let scaleX = 0;
    if (matrix && matrix !== "none") {
      const m2 = matrix.match(/matrix\(([^)]+)\)/);
      if (m2?.[1]) scaleX = parseFloat(m2[1].split(",")[0] ?? "0") || 0;
    }
    if (scaleX <= 0) {
      const fill = window.getComputedStyle(row).getPropertyValue("--line-fill");
      const pct = parseFloat(fill);
      if (isFinite(pct)) scaleX = Math.min(1, Math.max(0, pct / 100));
    }
    return Math.round(Math.min(1, Math.max(0, scaleX)) * durationMs);
  }

  function freezeAutoplayAtElapsed(row: HTMLElement, elapsedMs: number) {
    const durationMs = getRowAutoplayMs(row);
    const scaleX = Math.min(1, Math.max(0, elapsedMs / durationMs));
    row.classList.remove("is-autoplay-running");
    row.style.removeProperty("animation");
    const bar = row.querySelector<HTMLElement>(".pj-progress");
    if (bar) {
      bar.style.removeProperty("animation");
      bar.style.transform = "scaleX(" + scaleX + ")";
    }
    row.style.setProperty("--line-fill", scaleX * 100 + "%");
  }

  function runAutoplayUI(row: HTMLElement, opts: { elapsedMs?: number } = {}) {
    const elapsedMs = opts.elapsedMs && opts.elapsedMs > 0 ? opts.elapsedMs : 0;
    stopAutoplayUI();
    row.classList.add("is-autoplay-current");
    const bar = row.querySelector<HTMLElement>(".pj-progress");
    if (!bar) return;
    const durationMs = getRowAutoplayMs(row);
    const durationSec = durationMs / 1000;
    row.style.setProperty("--autoplay-duration", durationSec + "s");
    row.classList.remove("is-autoplay-resumed");
    row.style.removeProperty("animation");
    bar.style.removeProperty("animation");

    if (elapsedMs > 0 && elapsedMs < durationMs - 50) {
      const delaySec = -(elapsedMs / 1000);
      const scaleX = Math.min(1, elapsedMs / durationMs);
      row.classList.add("is-autoplay-resumed", "is-autoplay-running");
      row.style.setProperty("--line-fill", scaleX * 100 + "%");
      bar.style.transform = "scaleX(" + scaleX + ")";
      void row.offsetWidth;
      row.style.animation = "pj-line-fill-text " + durationSec + "s linear " + delaySec + "s forwards";
      bar.style.animation = "pj-line-loader " + durationSec + "s linear " + delaySec + "s forwards";
      return;
    }

    bar.style.removeProperty("transform");
    row.style.removeProperty("--line-fill");
    void row.offsetWidth;
    row.classList.add("is-autoplay-running");
  }

  function setActiveRowClass(index: number) {
    rows.forEach((row, i) => row.classList.toggle("is-active", i === index));
  }

  function clearAutoplayTimer() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
    autoplayDeadline = 0;
  }

  function scheduleAutoplayTimer(remainingMs?: number) {
    clearAutoplayTimer();
    let wait = typeof remainingMs === "number" ? remainingMs : AUTOPLAY_MS;
    if (wait < 50) wait = 50;
    autoplayDeadline = Date.now() + wait;
    autoplayTimer = window.setTimeout(() => {
      autoplayDeadline = 0;
      autoplayGoTo(currentIndex + 1);
    }, wait);
  }

  function goTo(index: number) {
    autoplayPause = null;
    currentIndex = (index + pairs.length) % pairs.length;
    const pair = pairs[currentIndex];
    if (!pair) return;
    setActive(pair.item);
    setActiveRowClass(currentIndex);
    runAutoplayUI(pair.row);
  }

  function autoplayGoTo(index: number) {
    warmNeighbors(((index % pairs.length) + pairs.length) % pairs.length);
    goTo(index);
    scheduleAutoplayTimer();
  }

  /* ---------- tab hide / wake ---------- */

  function syncStateFromActiveItem() {
    const active = getActiveItem();
    if (!active) return -1;
    const i = items.indexOf(active);
    if (i >= 0) currentIndex = i;
    return i;
  }

  function captureAutoplayPause() {
    const activeIdx = syncStateFromActiveItem();
    if (activeIdx >= 0) currentIndex = activeIdx;

    const pair = pairs[currentIndex];
    if (!pair) {
      autoplayPause = null;
      return;
    }
    const durationMs = getRowAutoplayMs(pair.row);
    let elapsedMs = 0;

    if (autoplayDeadline > Date.now()) {
      elapsedMs = durationMs - (autoplayDeadline - Date.now());
    } else if (pair.row.classList.contains("is-autoplay-running") || pair.row.classList.contains("is-autoplay-current")) {
      elapsedMs = readAutoplayElapsedMs(pair.row);
    }

    if (!elapsedMs || elapsedMs >= durationMs - 50) {
      autoplayPause = null;
      return;
    }

    elapsedMs = Math.round(Math.min(durationMs - 50, Math.max(0, elapsedMs)));
    autoplayPause = { index: currentIndex, elapsedMs };

    stopAutoplayUI();
    pair.row.classList.add("is-autoplay-current");
    freezeAutoplayAtElapsed(pair.row, elapsedMs);
  }

  function reconcileAfterWake() {
    if (switching && activeTransition) {
      const t = activeTransition;
      finishSwitch(t.prevItem, t.nextItem, t.gen, t.onDone);
      return;
    }

    cancelSwitchAnims();
    bg.classList.remove("is-video-switching");
    for (const item of items) {
      if (!item.classList.contains("is-active")) {
        item.classList.remove(...SWITCH_CLASSES);
        resetVideoStyles(item);
      }
    }

    const active = getActiveItem();
    if (active) {
      syncStateFromActiveItem();
      active.classList.remove(...SWITCH_CLASSES);
      resetVideoStyles(active);
      active.classList.add("is-active");
      playItem(active);
    }
  }

  function onVisibility() {
    if (document.hidden) {
      if (slideTimer) {
        clearTimeout(slideTimer);
        slideTimer = null;
      }
      captureAutoplayPause();
      clearAutoplayTimer();
      return;
    }

    reconcileAfterWake();
    const pair = pairs[currentIndex];
    if (!pair) return;
    setActiveRowClass(currentIndex);
    const elapsed = autoplayPause && autoplayPause.index === currentIndex ? autoplayPause.elapsedMs : 0;
    autoplayPause = null;
    runAutoplayUI(pair.row, { elapsedMs: elapsed });
    scheduleAutoplayTimer(elapsed > 0 ? AUTOPLAY_MS - elapsed : AUTOPLAY_MS);
  }

  /* ---------- mobile swipe ---------- */

  function goToBySwipe(delta: number) {
    if (switching || !delta) return;
    const next = (currentIndex + delta + pairs.length) % pairs.length;
    if (next === currentIndex) return;
    warmNeighbors(next);
    goTo(next);
    scheduleAutoplayTimer();
  }

  function onSwipeTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!mobileMq.matches || !t) return;
    touchStartY = t.clientY;
    touchStartX = t.clientX;
    touchStartTime = Date.now();
  }

  function onSwipeTouchEnd(e: TouchEvent) {
    if (!mobileMq.matches || switching) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dy = t.clientY - touchStartY;
    const dx = t.clientX - touchStartX;
    const dt = Date.now() - touchStartTime;
    if (dt > SWIPE_MAX_MS) return;
    if (Math.abs(dy) < SWIPE_MIN_PX) return;
    if (Math.abs(dy) < Math.abs(dx) * 1.2) return;
    goToBySwipe(dy < 0 ? 1 : -1);
  }

  /* ---------- row clicks ---------- */

  const rowHandlers = pairs.map((pair, idx) => {
    const handler = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("a")) return;
      if (idx === currentIndex) {
        if (target && onActiveRowClick?.(idx, target)) return;
        autoplayPause = null;
        runAutoplayUI(pair.row);
        scheduleAutoplayTimer();
        return;
      }
      warmNeighbors(idx);
      goTo(idx);
      scheduleAutoplayTimer();
    };
    pair.row.addEventListener("click", handler);
    return handler;
  });

  /* ---------- boot ---------- */

  for (const item of items) {
    item.classList.remove(...SWITCH_CLASSES, "is-active");
    resetVideoStyles(item);
  }
  bg.classList.remove("is-video-switching");
  for (const item of items) prepareVideo(getVideo(item));

  const first = pairs[0];
  if (first) {
    first.item.classList.add("is-active");
    warmNeighbors(0);
    playItem(first.item);
    setActiveRowClass(0);
    runAutoplayUI(first.row);
  }
  scheduleAutoplayTimer();

  swipeRoot.addEventListener("touchstart", onSwipeTouchStart, { passive: true });
  swipeRoot.addEventListener("touchend", onSwipeTouchEnd, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  return {
    goTo(index: number) {
      const idx = ((index % pairs.length) + pairs.length) % pairs.length;
      if (idx === currentIndex && getActiveItem() === pairs[idx]?.item) return;
      warmNeighbors(idx);
      goTo(idx);
      scheduleAutoplayTimer();
    },
    destroy() {
      switchGen++;
      cancelSwitchAnims();
      pendingSwitch = null;
      currentEnteringItem = null;
      activeTransition = null;
      if (slideTimer) clearTimeout(slideTimer);
      clearAutoplayTimer();
      pairs.forEach((pair, i) => {
        const handler = rowHandlers[i];
        if (handler) pair.row.removeEventListener("click", handler);
      });
      swipeRoot.removeEventListener("touchstart", onSwipeTouchStart);
      swipeRoot.removeEventListener("touchend", onSwipeTouchEnd);
      document.removeEventListener("visibilitychange", onVisibility);
      cleanupSwitchClasses();
      stopAutoplayUI();
      pauseAllExcept([]);
    },
  };
}
