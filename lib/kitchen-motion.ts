type Cue = { start: number; end: number };

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
