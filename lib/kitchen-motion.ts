type Cue = { start: number; end: number };

export function heroDockProgress(scrollY: number, heroHeight: number, viewportHeight: number) {
  const progress = Math.max(0, Math.min(1, scrollY / Math.max(1, heroHeight - viewportHeight)));
  return progress * (2 - progress);
}

// Run both the header and the camera against the same scroll sample.
const listeners = new Set<(scrollY: number, time: number) => void>();
let scrollFrame = 0;
let displayedScrollY = 0;
let previousFrame = 0;
let reducedMotion: MediaQueryList;

export function scheduleKitchenFrame() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(time => {
    scrollFrame = 0;
    const target = window.scrollY;
    const elapsed = previousFrame ? Math.min(time - previousFrame, 50) : 1000 / 60;
    const remaining = target - displayedScrollY;
    displayedScrollY = reducedMotion.matches || Math.abs(remaining) < .5
      ? target
      : displayedScrollY + remaining * (1 - Math.exp(-elapsed / 46));
    previousFrame = displayedScrollY === target ? 0 : time;
    listeners.forEach(update => update(displayedScrollY, time));
    if (previousFrame) scheduleKitchenFrame();
  });
}

export function observeKitchenScroll(update: (scrollY: number, time: number) => void) {
  if (!listeners.size) {
    reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    displayedScrollY = window.scrollY;
    window.addEventListener('scroll', scheduleKitchenFrame, { passive: true });
  }
  listeners.add(update);
  return () => {
    listeners.delete(update);
    if (listeners.size) return;
    window.removeEventListener('scroll', scheduleKitchenFrame);
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    previousFrame = 0;
  };
}

export function motionOpenness(time: number, phase: 'closed' | 'opening' | 'open' | 'closing', opening: Cue, closing: Cue) {
  if (phase === 'closed') return 0;
  if (phase === 'open') return 1;
  const cue = phase === 'opening' ? opening : closing;
  const progress = Math.max(0, Math.min(1, (time - cue.start) / (cue.end - cue.start)));
  return phase === 'opening' ? progress : 1 - progress;
}

/** Matched forward/reverse frames let an interrupted gesture change direction. */
export function reverseMotionTime(currentTime: number, from: Cue, to: Cue) {
  const progress = Math.max(0, Math.min(1, (currentTime - from.start) / (from.end - from.start)));
  return to.end - progress * (to.end - to.start);
}
