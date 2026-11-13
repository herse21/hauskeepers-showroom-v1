import type { CalloutAnchor, CalloutRect } from '../lib/kitchen-callout';

export type KitchenCue = { start: number; end: number };

/**
 * Replace a pending clip only after inspecting the export and measuring its cues.
 * The video carries its own camera move and renders in a viewport layer, outside
 * the photograph's CSS camera. Intro must end on a close-up that is still closed
 * before opening begins; exit returns to the shared closed wide reference.
 */
export type KitchenClip = {
  status: 'pending';
  video: null;
  width: null;
  height: null;
  wideFrame: null;
  intro: null;
  opening: null;
  closing: null;
  exit: null;
  detailHotspot: null;
  detailFraming: null;
} | {
  status: 'ready';
  video: string;
  width: number;
  height: number;
  /** Seconds of the closed wide frame used to align the scene handoff. */
  wideFrame: number;
  intro: KitchenCue;
  opening: KitchenCue;
  closing: KitchenCue;
  /** Playback speed for button-triggered motion, independent of scroll scrubbing. */
  actionPlaybackRate?: number;
  /** Opening and closing are the same frames in reverse order. */
  mirroredMotion?: boolean;
  /** Actual drawer movement can occupy less time than its camera sequence. */
  reveal?: { opening: KitchenCue; closing: KitchenCue };
  exit: KitchenCue;
  /** Normalized coordinates in the measured close-up video frame, before fitting. */
  detailHotspot: { x: number; y: number };
  /** Annotation origin inside the product in the measured close-up. */
  detailPointer?: { x: number; y: number };
  /** Cabinet edges and the area swept by its moving front in the source frame. */
  callout?: { anchors: CalloutAnchor[]; movingFront: CalloutRect };
  /** Desired on-screen hotspot positions, chosen after inspecting the clip (0 to 1). */
  detailFraming: { desktop: { x: number; y: number }; mobile: { x: number; y: number } };
  /** Measured centres of a moving front, in forward-opening video time. */
  hotspotMotion?: { at: number; x: number; y: number; pointer?: { x: number; y: number }; openness?: number }[];
  /** Pause with the door open before the independent inner drawer moves. */
  cabinetDrawer?: {
    doorOpen: number;
    cabinetOpenHotspot: { x: number; y: number };
    drawerClosedHotspot: { x: number; y: number };
    drawerOpenHotspot: { x: number; y: number };
  };
};

/** Coordinates are fractions of the SAME uncropped reference image, from 0 to 1. */
export type KitchenCamera = { focusX: number; focusY: number; zoom: number; screenX: number; screenY: number };
export type KitchenProduct = {
  id: string;
  anchor: string;
  brand: string;
  name: string;
  title: string;
  description: string;
  detail: string;
  action: string;
  specs: string[];
  source: string;
  hotspot: { x: number; y: number };
  camera: { desktop: KitchenCamera; mobile: KitchenCamera };
  clip: KitchenClip;
};

export const kitchenScene = {
  image: '/assets/kitchen-hardware-v4.webp',
  width: 1672,
  height: 941,
  title: 'Un espacio.\nMás posibilidades.',
  description: 'Desliza. Acércate. Descubre cada detalle.',
  camera: {
    desktop: { focusX: .5, focusY: .5, zoom: 1, screenX: .5, screenY: .5 },
    mobile: { focusX: .5, focusY: .5, zoom: 1, screenX: .5, screenY: .5 },
  },
} satisfies { image: string; width: number; height: number; title: string; description: string; camera: { desktop: KitchenCamera; mobile: KitchenCamera } };

// Every clip must start and finish at the shared wide reference of the closed kitchen.
// Its own intro/exit camera move must not receive the photograph's CSS zoom again.
// Do not substitute unrelated manufacturer videos: the scene must remain continuous.
// Pending entries deliberately have no guessed path or playback times.
export const kitchenProducts: KitchenProduct[] = [
  {
    id: 'servo-drive', anchor: 'productos', brand: 'Blum', name: 'SERVO-DRIVE',
    title: 'Un toque.\nY se abre.', description: 'El movimiento empieza aquí.',
    detail: 'Un toque activa la apertura eléctrica. Cierre suave con BLUMOTION.',
    action: 'Activa SERVO-DRIVE', specs: ['Apertura eléctrica con un toque', 'Cierre suave con BLUMOTION'],
    source: 'https://www.blum.com/mx/es/products/motion-technologies/servo-drive/servo-drive-pullouts/programme/',
    hotspot: { x: .475, y: .50 },
    camera: {
      desktop: { focusX: .475, focusY: .50, zoom: 1.5, screenX: .45, screenY: .44 },
      mobile: { focusX: .475, focusY: .50, zoom: 1.3, screenX: .52, screenY: .40 },
    },
    clip: {
      status: 'ready', video: '/assets/kitchen-servo-drive-v7-720p.mp4', width: 1280, height: 720,
      wideFrame: 0, intro: { start: 0, end: 23 / 24 }, opening: { start: 23 / 24, end: 119 / 24 },
      closing: { start: 120 / 24, end: 216 / 24 }, exit: { start: 216 / 24, end: 239 / 24 },
      actionPlaybackRate: 2.35,
      mirroredMotion: true,
      detailHotspot: { x: .41875, y: .4278 }, detailPointer: { x: .583, y: .497 },
      callout: {
        anchors: [{ x: .75, y: .40, exit: 'right' }, { x: .58, y: .865, exit: 'down' }, { x: .245, y: .73, exit: 'left' }],
        movingFront: { left: .14, top: .295, right: .61, bottom: .615 },
      },
      detailFraming: { desktop: { x: .41875, y: .4278 }, mobile: { x: .41875, y: .4278 } },
      hotspotMotion: [
        { at: 24 / 24, x: .41875, y: .4278, pointer: { x: .59, y: .46 }, openness: 0 },
        { at: 45 / 24, x: .4125, y: .4313, pointer: { x: .592, y: .461 }, openness: .067 },
        { at: 66 / 24, x: .3914, y: .4333, pointer: { x: .583, y: .497 }, openness: .292 },
        { at: 87 / 24, x: .3617, y: .4410, pointer: { x: .5703, y: .514 }, openness: .608 },
        { at: 108 / 24, x: .3367, y: .4451, pointer: { x: .5578, y: .5194 }, openness: .875 },
        { at: 119 / 24, x: .325, y: .4479, pointer: { x: .5484, y: .525 }, openness: 1 },
      ],
    },
  },
  {
    id: 'aventos', anchor: 'aventos', brand: 'Blum', name: 'AVENTOS',
    title: 'Más espacio.\nMás libertad.', description: 'Una nueva manera de abrir.',
    detail: 'Frentes que se elevan para dejar libre el acceso al mueble superior.',
    action: 'Eleva el frente', specs: ['Acceso libre al mueble superior', 'Cierre suave con BLUMOTION'],
    source: 'https://www.blum.com/mx/es/products/liftsystems/aventos/overview/',
    hotspot: { x: .638, y: .196 },
    camera: {
      desktop: { focusX: .638, focusY: .196, zoom: 2, screenX: .65, screenY: .43 },
      mobile: { focusX: .638, focusY: .196, zoom: 1.55, screenX: .52, screenY: .38 },
    },
    clip: {
      status: 'ready', video: '/assets/kitchen-aventos-v7-720p.mp4', width: 1280, height: 720,
      wideFrame: 0, intro: { start: 0, end: 23 / 24 }, opening: { start: 23 / 24, end: 119 / 24 },
      closing: { start: 120 / 24, end: 216 / 24 }, exit: { start: 216 / 24, end: 239 / 24 },
      actionPlaybackRate: 2.1,
      mirroredMotion: true,
      detailHotspot: { x: .3781, y: .5042 }, detailPointer: { x: .39, y: .58 },
      callout: {
        anchors: [{ x: .603, y: .602, exit: 'right' }, { x: .51, y: .65, exit: 'down' }],
        movingFront: { left: .13, top: .31, right: .58, bottom: .62 },
      },
      detailFraming: { desktop: { x: .3781, y: .5042 }, mobile: { x: .3781, y: .5042 } },
      hotspotMotion: [
        { at: 24 / 24, x: .3781, y: .5042, openness: 0 },
        { at: 40 / 24, x: .3723, y: .5007, openness: .028 },
        { at: 56 / 24, x: .3641, y: .4910, openness: .153 },
        { at: 71 / 24, x: .3566, y: .4667, openness: .413 },
        { at: 87 / 24, x: .3521, y: .4420, openness: .667 },
        { at: 103 / 24, x: .3502, y: .4201, openness: .892 },
        { at: 119 / 24, x: .3496, y: .4087, openness: 1 },
      ],
    },
  },
  {
    id: 'space-tower', anchor: 'visita', brand: 'Blum', name: 'SPACE TOWER',
    title: 'Todo a la vista.\nTodo a tu alcance.', description: 'Hay cosas que tienes que abrir para entender.',
    detail: 'Cajones LEGRABOX independientes. Todo a la vista, nivel por nivel.',
    action: 'Abre la despensa', specs: ['Extraíbles independientes', 'LEGRABOX Noble Rust'],
    source: 'https://www.blum.com/mx/es/products/cabinet-applications/space-tower/overview/',
    hotspot: { x: .816, y: .298 },
    camera: {
      desktop: { focusX: .816, focusY: .298, zoom: 1.48, screenX: .76, screenY: .46 },
      mobile: { focusX: .816, focusY: .298, zoom: 1.4, screenX: .60, screenY: .39 },
    },
    clip: {
      status: 'ready', video: '/assets/kitchen-space-tower-v8-720p.mp4', width: 1280, height: 720,
      wideFrame: 0, intro: { start: 0, end: 35 / 24 }, opening: { start: 35 / 24, end: 119 / 24 },
      closing: { start: 120 / 24, end: 204 / 24 }, exit: { start: 204 / 24, end: 239 / 24 },
      actionPlaybackRate: 1.7,
      mirroredMotion: true,
      detailHotspot: { x: .53, y: .34 },
      detailFraming: { desktop: { x: .53, y: .34 }, mobile: { x: .53, y: .34 } },
      cabinetDrawer: {
        doorOpen: 81 / 24,
        cabinetOpenHotspot: { x: .20, y: .31 },
        drawerClosedHotspot: { x: .51, y: .56 },
        drawerOpenHotspot: { x: .43, y: .57 },
      },
    },
  },
];

export function isKitchenClipReady(clip: KitchenClip): clip is Extract<KitchenClip, { status: 'ready' }> {
  if (clip.status !== 'ready' || !clip.video.trim()) return false;
  if (![clip.width, clip.height].every(value => Number.isFinite(value) && value > 0)) return false;
  if (![clip.detailHotspot.x, clip.detailHotspot.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) return false;
  if (clip.detailPointer && ![clip.detailPointer.x, clip.detailPointer.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) return false;
  if (clip.hotspotMotion && !clip.hotspotMotion.every((point, index, points) => Number.isFinite(point.at) && point.at >= clip.opening.start && point.at <= clip.opening.end && (index === 0 || point.at > points[index - 1].at) && [point.x, point.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1))) return false;
  if (clip.hotspotMotion?.some(point => point.pointer && ![point.pointer.x, point.pointer.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1))) return false;
  if (clip.hotspotMotion?.some(point => point.openness !== undefined && (!Number.isFinite(point.openness) || point.openness < 0 || point.openness > 1))) return false;
  if (clip.reveal && !(['opening', 'closing'] as const).every(phase => Number.isFinite(clip.reveal![phase].start) && Number.isFinite(clip.reveal![phase].end) && clip.reveal![phase].start >= clip[phase].start && clip.reveal![phase].end <= clip[phase].end && clip.reveal![phase].start < clip.reveal![phase].end)) return false;
  if (clip.cabinetDrawer) {
    const steps = clip.cabinetDrawer;
    if (!clip.mirroredMotion || !Number.isFinite(steps.doorOpen) || steps.doorOpen <= clip.opening.start || steps.doorOpen >= clip.opening.end) return false;
    if (![steps.cabinetOpenHotspot, steps.drawerClosedHotspot, steps.drawerOpenHotspot].every(point => [point.x, point.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1))) return false;
  }
  if (![clip.detailFraming.desktop.x, clip.detailFraming.desktop.y, clip.detailFraming.mobile.x, clip.detailFraming.mobile.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) return false;
  const times = [clip.wideFrame, clip.intro.start, clip.intro.end, clip.opening.start, clip.opening.end, clip.closing.start, clip.closing.end, clip.exit.start, clip.exit.end];
  if (!times.every(Number.isFinite) || clip.wideFrame < 0) return false;
  return clip.wideFrame <= clip.intro.start
    && clip.intro.start < clip.intro.end
    && clip.intro.end <= clip.opening.start
    && clip.opening.start < clip.opening.end
    && clip.opening.end <= clip.closing.start
    && clip.closing.start < clip.closing.end
    && clip.closing.end <= clip.exit.start
    && clip.exit.start < clip.exit.end;
}
