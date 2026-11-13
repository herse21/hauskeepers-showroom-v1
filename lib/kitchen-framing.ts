/** Move from the immersive hero into a complete, uncropped phone video. */
export function portraitVideoFrame(width: number, height: number, mediaWidth: number, mediaHeight: number, focus: number) {
  const amount = Math.max(0, Math.min(1, focus));
  const cover = Math.max(width / mediaWidth, height / mediaHeight);
  const full = width / mediaWidth;
  const scale = cover + (full - cover) * amount;
  return {
    x: (width - mediaWidth * cover) / 2 * (1 - amount),
    y: Math.max(100, Math.min(150, height * .14)) * amount,
    width: mediaWidth * scale,
    height: mediaHeight * scale,
  };
}
