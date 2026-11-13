'use client';

import { useEffect, useRef, useState } from 'react';
import { Arrow, BrandMark, SolutionButton, WhatsApp, useContent } from './experience';
import { isKitchenClipReady, kitchenProducts, kitchenScene, type KitchenCamera, type KitchenClip } from './kitchen-media';
import { track } from '../lib/analytics';
import { motionOpenness, reverseMotionTime } from '../lib/kitchen-motion';
import { portraitVideoFrame } from '../lib/kitchen-framing';
import { kitchenCalloutPath } from '../lib/kitchen-callout';

type Phase = 'closed' | 'opening' | 'open' | 'closing';
type MovingPhase = Extract<Phase, 'opening' | 'closing'>;
type CabinetStep = 0 | 1 | 2;
type ReadyClip = Extract<KitchenClip, { status: 'ready' }>;
type Deck = [number | null, number | null];
type OpticalTarget = { index: number; time: number; mode: 'wide' | 'intro' | 'detail' | 'exit' };
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value: number) => value * value * (3 - 2 * value);
const interpolate = (from: number, to: number, amount: number) => from + (to - from) * amount;
const portraitFilm = (width: number, height: number) => width <= 1024 && height >= width;

function cabinetTime(clip: ReadyClip, step: CabinetStep) {
  return step === 0 ? clip.opening.start : step === 1 ? clip.cabinetDrawer!.doorOpen : clip.opening.end;
}

function openingTime(clip: ReadyClip, phase: Phase, time: number, settled: CabinetStep) {
  if (phase === 'closed') return clip.opening.start;
  if (phase === 'open') return cabinetTime(clip, settled);
  return phase === 'closing' ? reverseMotionTime(time, clip.closing, clip.opening) : clamp(time, clip.opening.start, clip.opening.end);
}

function useEnvironment() {
  const [environment, setEnvironment] = useState({ ready: false, visible: true, reduced: true, saveData: false });
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const update = () => setEnvironment({ ready: true, visible: !document.hidden, reduced: reduced.matches, saveData: Boolean(connection?.saveData) });
    update();
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    connection?.addEventListener('change', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
      connection?.removeEventListener('change', update);
    };
  }, []);
  return environment;
}

export function InteractiveShowroom() {
  const data = useContent();
  const environment = useEnvironment();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const ambience = useRef<HTMLCanvasElement>(null);
  const aventosFrame = useRef<HTMLCanvasElement>(null);
  const hotspot = useRef<HTMLButtonElement>(null);
  const drawerButton = useRef<HTMLButtonElement>(null);
  const heroLink = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const connector = useRef<SVGPathElement>(null);
  const calloutPoint = useRef({ x: 0, y: 0 });
  const calloutFrame = useRef<{ index: number; x: number; y: number; width: number; height: number } | null>(null);
  const drawCallout = useRef<() => void>(() => {});
  const viewportPosition = useRef<{ height: number; units: number; within: boolean } | null>(null);
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const presentedTimes = useRef<[number, number]>([0, 0]);
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);
  const [hotspotVisible, setHotspotVisible] = useState(true);
  const hotspotVisibleRef = useRef(true);
  const [deck, setDeck] = useState<Deck>([null, null]);
  const deckRef = useRef<Deck>([null, null]);
  const activeSlot = useRef(0);
  const [shownSlot, setShownSlot] = useState<number | null>(null);
  const shownProduct = shownSlot === null ? null : deck[shownSlot];
  const [phase, setPhase] = useState<Phase>('closed');
  const phaseRef = useRef<Phase>('closed');
  const [informationOpen, setInformationOpen] = useState(false);
  const informationRef = useRef(false);
  const desiredOpen = useRef(false);
  const [cabinetStep, setCabinetStep] = useState<CabinetStep>(0);
  const cabinetStepRef = useRef<CabinetStep>(0);
  const [cabinetTarget, setCabinetTarget] = useState<CabinetStep>(0);
  const cabinetTargetRef = useRef<CabinetStep>(0);
  const pendingSegment = useRef<MovingPhase | null>(null);
  const segmentEnd = useRef<number | null>(null);
  const sequence = useRef(0);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [stageVisible, setStageVisible] = useState(true);
  const [nearShowroom, setNearShowroom] = useState(false);
  const [requested, setRequested] = useState<Set<number>>(() => new Set());
  const [errors, setErrors] = useState<Set<number>>(() => new Set());
  const errorsRef = useRef(new Set<number>());
  const opticalTarget = useRef<OpticalTarget | null>(null);
  const syncOpticalTarget = useRef<(target: OpticalTarget | null) => void>(() => {});
  const heroNavigation = useRef(false);
  const playbackButton = useRef<HTMLButtonElement>(null);
  const productIndex = chapter - 1;
  const product = kitchenProducts[productIndex];
  const ready = product ? isKitchenClipReady(product.clip) : false;
  const failed = errors.has(productIndex);
  const stagedCabinet = ready && product.clip.status === 'ready' && Boolean(product.clip.cabinetDrawer);
  const calloutActive = informationOpen || (ready && !failed && phase !== 'closed');
  const solution = product && data.solutions.find(candidate => candidate.id === product.id);

  const videoAt = (slot: number) => slot === 0 ? videoA.current : videoB.current;
  const changePhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };
  const showInformation = (next: boolean) => { informationRef.current = next; setInformationOpen(next); };
  const assignDeck = (next: Deck) => { deckRef.current = next; setDeck(next); };
  const restoreFocus = () => (hotspotVisibleRef.current ? cabinetStepRef.current > 0 && cabinetTargetRef.current > 0 && drawerButton.current ? drawerButton.current : hotspot.current : stage.current)?.focus({ preventScroll: true });
  const syncCalloutProgress = () => {
    const item = kitchenProducts[chapterRef.current - 1];
    const node = videoAt(activeSlot.current);
    if (!item || !isKitchenClipReady(item.clip) || !node) return;
    let amount = motionOpenness(node.currentTime, phaseRef.current, item.clip.reveal?.opening ?? item.clip.opening, item.clip.reveal?.closing ?? item.clip.closing);
    const points = item.clip.hotspotMotion;
    if (points?.[0]?.openness !== undefined) {
      const time = phaseRef.current === 'closed' ? item.clip.opening.start : phaseRef.current === 'open' ? item.clip.opening.end : phaseRef.current === 'closing' ? reverseMotionTime(node.currentTime, item.clip.closing, item.clip.opening) : node.currentTime;
      amount = (time <= points[0].at ? points[0] : points[points.length - 1]).openness ?? amount;
      for (let index = 1; index < points.length; index += 1) {
        if (time > points[index].at) continue;
        const from = points[index - 1], to = points[index];
        amount = interpolate(from.openness ?? 0, to.openness ?? 1, clamp((time - from.at) / (to.at - from.at)));
        break;
      }
    }
    connector.current?.style.setProperty('--kitchen-open', `${amount}`);
    if (item.clip.cabinetDrawer || item.clip.hotspotMotion) {
      const projection = frameVideo(activeSlot.current, { index: chapterRef.current - 1, time: item.clip.opening.start, mode: 'detail' });
      if (projection) {
        calloutPoint.current = { x: projection.pointerX, y: projection.pointerY };
        if (connector.current) drawCallout.current();
      }
    }
  };
  const frameVideo = (slot: number, target: OpticalTarget) => {
    const item = kitchenProducts[target.index];
    const clip = item?.clip;
    const surface = stage.current;
    const node = videoAt(slot);
    if (!surface || !node || !clip || !isKitchenClipReady(clip)) return null;
    const sharpFrame = item.id === 'aventos' && slot === shownSlot ? aventosFrame.current : null;
    const width = surface.clientWidth, height = surface.clientHeight;
    let movingHotspot = clip.detailHotspot;
    const staticPointer = clip.detailPointer ?? clip.detailHotspot;
    let movingPointer = staticPointer;
    if (clip.hotspotMotion?.length) {
      const time = phaseRef.current === 'closed' ? clip.opening.start : phaseRef.current === 'open' ? clip.opening.end : phaseRef.current === 'closing' ? reverseMotionTime(node.currentTime, clip.closing, clip.opening) : node.currentTime;
      const points = clip.hotspotMotion;
      const boundary = time <= points[0].at ? points[0] : points[points.length - 1];
      movingHotspot = boundary;
      movingPointer = boundary.pointer ?? staticPointer;
      for (let index = 1; index < points.length; index += 1) {
        if (time > points[index].at) continue;
        const from = points[index - 1], to = points[index];
        const amount = clamp((time - from.at) / (to.at - from.at));
        movingHotspot = { x: interpolate(from.x, to.x, amount), y: interpolate(from.y, to.y, amount) };
        const fromPointer = from.pointer ?? staticPointer, toPointer = to.pointer ?? staticPointer;
        movingPointer = { x: interpolate(fromPointer.x, toPointer.x, amount), y: interpolate(fromPointer.y, toPointer.y, amount) };
        break;
      }
    }
    const paintCabinetControls = (x: number, y: number, w: number, h: number) => {
      if (target.mode === 'detail' && clip.callout) calloutFrame.current = { index: target.index, x, y, width: w, height: h };
      if (clip.hotspotMotion) {
        surface.style.setProperty('--kitchen-hotspot-x', `${x + movingHotspot.x * w}px`);
        surface.style.setProperty('--kitchen-hotspot-y', `${y + movingHotspot.y * h}px`);
      }
      const steps = clip.cabinetDrawer;
      if (!steps) return;
      const time = openingTime(clip, phaseRef.current, node.currentTime, cabinetStepRef.current);
      const door = clamp((time - clip.opening.start) / (steps.doorOpen - clip.opening.start));
      const drawer = clamp((time - steps.doorOpen) / (clip.opening.end - steps.doorOpen));
      const cabinetPoint = { x: interpolate(clip.detailHotspot.x, steps.cabinetOpenHotspot.x, door), y: interpolate(clip.detailHotspot.y, steps.cabinetOpenHotspot.y, door) };
      const drawerPoint = { x: interpolate(steps.drawerClosedHotspot.x, steps.drawerOpenHotspot.x, drawer), y: interpolate(steps.drawerClosedHotspot.y, steps.drawerOpenHotspot.y, drawer) };
      surface.style.setProperty('--kitchen-cabinet-x', `${x + cabinetPoint.x * w}px`);
      surface.style.setProperty('--kitchen-cabinet-y', `${y + cabinetPoint.y * h}px`);
      surface.style.setProperty('--kitchen-drawer-x', `${x + drawerPoint.x * w}px`);
      surface.style.setProperty('--kitchen-drawer-y', `${y + drawerPoint.y * h}px`);
    };
    const amount = target.mode === 'wide' ? 0 : target.mode === 'detail' ? 1 : target.mode === 'intro'
      ? smooth(clamp((target.time - clip.intro.start) / (clip.intro.end - clip.intro.start)))
      : 1 - smooth(clamp((target.time - clip.exit.start) / (clip.exit.end - clip.exit.start)));
    if (portraitFilm(window.innerWidth, height)) {
      const frame = portraitVideoFrame(width, height, clip.width, clip.height, amount);
      node.style.inset = 'auto';
      node.style.left = `${frame.x}px`;
      node.style.top = `${frame.y}px`;
      node.style.width = `${frame.width}px`;
      node.style.height = `${frame.height}px`;
      node.style.objectFit = 'contain';
      node.style.objectPosition = 'center';
      if (sharpFrame) sharpFrame.style.cssText = node.style.cssText;
      surface.style.setProperty('--kitchen-film-focus', `${amount}`);
      surface.style.setProperty('--kitchen-film-bottom', `${frame.y + frame.height}px`);
      paintCabinetControls(frame.x, frame.y, frame.width, frame.height);
      return {
        x: frame.x + movingHotspot.x * frame.width, y: frame.y + movingHotspot.y * frame.height,
        pointerX: frame.x + movingPointer.x * frame.width, pointerY: frame.y + movingPointer.y * frame.height,
      };
    }
    for (const property of ['inset', 'left', 'top', 'width', 'height', 'object-fit']) node.style.removeProperty(property);
    surface.style.setProperty('--kitchen-film-focus', '0');
    const fit = Math.max(width / clip.width, height / clip.height);
    const fittedWidth = clip.width * fit, fittedHeight = clip.height * fit;
    const stacked = window.innerWidth <= 700 && (height >= 500 || height >= window.innerWidth);
    const framing = clip.detailFraming[stacked ? 'mobile' : 'desktop'];
    // A short portrait viewport cannot pan a cover-fitted video vertically.
    // Put the control on the upper part of the same cabinet face instead.
    const interactionPoint = stacked && height < 720
      ? { ...clip.detailHotspot, y: Math.min(clip.detailHotspot.y, .3) }
      : !stacked && height < 360
        ? { ...clip.detailHotspot, y: Math.max(clip.detailHotspot.y, .46) }
        : clip.detailHotspot;
    const wantedX = clamp(width * framing.x, 58, width - 58);
    const focusY = stacked && height < 720 ? Math.min(framing.y, .3) : framing.y;
    const wantedY = clamp(height * focusY, Math.min(145, height * .46), Math.max(height - 150, height * .54));
    const detailX = clamp(wantedX - interactionPoint.x * fittedWidth, width - fittedWidth, 0);
    const detailY = clamp(wantedY - interactionPoint.y * fittedHeight, height - fittedHeight, 0);
    const x = interpolate((width - fittedWidth) / 2, detailX, amount);
    const y = interpolate((height - fittedHeight) / 2, detailY, amount);
    const positionX = fittedWidth > width ? -x / (fittedWidth - width) : .5;
    const positionY = fittedHeight > height ? -y / (fittedHeight - height) : .5;
    // Only the viewport crop moves. The clip's own zoom is never scaled again.
    node.style.objectPosition = `${(positionX * 100).toFixed(4)}% ${(positionY * 100).toFixed(4)}%`;
    if (sharpFrame) sharpFrame.style.cssText = node.style.cssText;
    paintCabinetControls(x, y, fittedWidth, fittedHeight);
    return {
      x: x + (clip.hotspotMotion ? movingHotspot.x : interactionPoint.x) * fittedWidth, y: y + (clip.hotspotMotion ? movingHotspot.y : interactionPoint.y) * fittedHeight,
      pointerX: x + movingPointer.x * fittedWidth, pointerY: y + movingPointer.y * fittedHeight,
    };
  };

  drawCallout.current = () => {
    const card = panel.current, surface = stage.current, line = connector.current;
    const frame = calloutFrame.current;
    const clip = kitchenProducts[chapterRef.current - 1]?.clip;
    if (!card || !surface || !line || !frame || frame.index !== chapterRef.current - 1 || clip?.status !== 'ready' || !clip.callout) return;

    const { anchors, movingFront } = clip.callout;
    const projectX = (x: number) => frame.x + x * frame.width;
    const projectY = (y: number) => frame.y + y * frame.height;
    const viewport = surface.getBoundingClientRect();
    const control = hotspot.current?.getBoundingClientRect();
    const path = kitchenCalloutPath(
      anchors.map(anchor => ({ ...anchor, x: projectX(anchor.x), y: projectY(anchor.y) })),
      { left: projectX(movingFront.left), right: projectX(movingFront.right), top: projectY(movingFront.top), bottom: projectY(movingFront.bottom) },
      calloutPoint.current,
      { left: card.offsetLeft, right: card.offsetLeft + card.offsetWidth, top: card.offsetTop, bottom: card.offsetTop + card.offsetHeight },
      control ? { left: control.left - viewport.left, right: control.right - viewport.left, top: control.top - viewport.top, bottom: control.bottom - viewport.top } : null,
      surface.clientWidth, surface.clientHeight,
    );
    if (line.getAttribute('d') !== path) line.setAttribute('d', path);
  };
  const resetInteraction = () => {
    const needsFocus = panel.current?.contains(document.activeElement) || document.activeElement === playbackButton.current || document.activeElement === drawerButton.current;
    sequence.current += 1;
    videoA.current?.pause();
    videoB.current?.pause();
    pendingSegment.current = null;
    segmentEnd.current = null;
    desiredOpen.current = false;
    cabinetStepRef.current = 0;
    cabinetTargetRef.current = 0;
    setCabinetStep(0);
    setCabinetTarget(0);
    manuallyPaused.current = false;
    changePhase('closed');
    showInformation(false);
    setPlaying(false);
    if (needsFocus) stage.current?.focus({ preventScroll: true });
  };

  const failPlayback = (index: number) => {
    errorsRef.current = new Set(errorsRef.current).add(index);
    setErrors(new Set(errorsRef.current));
    if (index !== chapterRef.current - 1) return;
    sequence.current += 1;
    pendingSegment.current = null;
    segmentEnd.current = null;
    desiredOpen.current = false;
    videoAt(activeSlot.current)?.pause();
    setShownSlot(null);
    changePhase('closed');
  };

  const startSegment = (next: MovingPhase) => {
    const index = chapterRef.current - 1;
    const item = kitchenProducts[index];
    if (!item || !isKitchenClipReady(item.clip) || errorsRef.current.has(index)) return;
    const slot = deckRef.current.indexOf(index);
    if (slot < 0) return;
    activeSlot.current = slot;
    const node = videoAt(slot);
    if (!node) return;
    const previousPhase = phaseRef.current;
    const reversing = item.clip.mirroredMotion &&
      ((previousPhase === 'opening' && next === 'closing') || (previousPhase === 'closing' && next === 'opening'));
    let startTime = reversing
      ? reverseMotionTime(node.currentTime, item.clip[previousPhase as MovingPhase], item.clip[next])
      : item.clip[next].start;
    if (item.clip.cabinetDrawer) {
      const time = openingTime(item.clip, previousPhase, node.currentTime, cabinetStepRef.current);
      startTime = next === 'opening' ? time : reverseMotionTime(time, item.clip.opening, item.clip.closing);
    }
    sequence.current += 1;
    node.pause();
    pendingSegment.current = next;
    manuallyPaused.current = false;
    changePhase(next);
    setRequested(previous => new Set(previous).add(index));
    if (node.readyState < 1 || node.getAttribute('src') !== item.clip.video) return;
    const clip = item.clip;
    if (!Number.isFinite(node.duration) || clip.exit.end > node.duration + .05) { failPlayback(index); return; }
    pendingSegment.current = null;
    frameVideo(slot, { index, time: clip.opening.start, mode: 'detail' });
    const destination = clip.cabinetDrawer ? cabinetTime(clip, cabinetTargetRef.current) : null;
    segmentEnd.current = destination === null ? clip[next].end : next === 'opening' ? destination : reverseMotionTime(destination, clip.opening, clip.closing);
    node.playbackRate = clip.actionPlaybackRate ?? 1;
    node.currentTime = startTime;
    syncCalloutProgress();
    const currentSequence = sequence.current;
    if (stageVisible && !document.hidden) node.play().catch(error => {
      if (error?.name !== 'AbortError' && currentSequence === sequence.current) failPlayback(index);
    });
  };

  const completeSegment = (slot: number) => {
    if (slot !== activeSlot.current || !['opening', 'closing'].includes(phaseRef.current)) return;
    const node = videoAt(slot);
    const completed = phaseRef.current;
    const restorePlaybackFocus = document.activeElement === playbackButton.current;
    node?.pause();
    if (node && segmentEnd.current !== null) node.currentTime = segmentEnd.current;
    segmentEnd.current = null;
    const item = kitchenProducts[chapterRef.current - 1];
    if (item?.clip.status === 'ready' && item.clip.cabinetDrawer) {
      const settled = cabinetTargetRef.current;
      cabinetStepRef.current = settled;
      setCabinetStep(settled);
      changePhase(settled === 0 ? 'closed' : 'open');
      if (settled === 0) syncOpticalTarget.current(opticalTarget.current);
      syncCalloutProgress();
      if (restorePlaybackFocus) requestAnimationFrame(restoreFocus);
      return;
    }
    if (completed === 'opening') {
      changePhase('open');
      if (!desiredOpen.current) startSegment('closing');
    } else {
      changePhase('closed');
      if (desiredOpen.current) startSegment('opening');
      else syncOpticalTarget.current(opticalTarget.current);
    }
    syncCalloutProgress();
    if (restorePlaybackFocus && !['opening', 'closing'].includes(phaseRef.current)) requestAnimationFrame(restoreFocus);
  };

  const requestCabinetStep = (next: CabinetStep) => {
    const index = chapterRef.current - 1;
    const item = kitchenProducts[index];
    if (!item || !isKitchenClipReady(item.clip) || !item.clip.cabinetDrawer || errorsRef.current.has(index)) return;
    const target = opticalTarget.current;
    if (target?.index !== index || target.mode !== 'detail') return;
    const node = videoAt(activeSlot.current);
    if (!node) return;
    const time = openingTime(item.clip, phaseRef.current, node.currentTime, cabinetStepRef.current);
    cabinetTargetRef.current = next;
    setCabinetTarget(next);
    showInformation(next === 2);
    const destination = cabinetTime(item.clip, next);
    if (Math.abs(time - destination) < .012) {
      node.pause();
      pendingSegment.current = null;
      segmentEnd.current = null;
      cabinetStepRef.current = next;
      setCabinetStep(next);
      changePhase(next === 0 ? 'closed' : 'open');
      syncCalloutProgress();
      return;
    }
    if (next === 2) track({ event: 'solution_open', solution: item.id, brand: item.brand, section: item.anchor });
    startSegment(destination > time ? 'opening' : 'closing');
  };

  const requestState = (next: boolean) => {
    const index = chapterRef.current - 1;
    const item = kitchenProducts[index];
    if (!item) return;
    if (isKitchenClipReady(item.clip) && item.clip.cabinetDrawer && !errorsRef.current.has(index)) { requestCabinetStep(next ? 2 : 1); return; }
    const target = opticalTarget.current;
    if (isKitchenClipReady(item.clip) && !errorsRef.current.has(index) && (target?.index !== index || target.mode !== 'detail')) return;
    desiredOpen.current = next;
    showInformation(next);
    if (next) track({ event: 'solution_open', solution: item.id, brand: item.brand, section: item.anchor });
    if (!isKitchenClipReady(item.clip) || errorsRef.current.has(index)) return;
    if (!next && pendingSegment.current === 'opening') {
      pendingSegment.current = null;
      changePhase('closed');
      return;
    }
    if (phaseRef.current === 'closed' && next) startSegment('opening');
    else if (phaseRef.current === 'open' && !next) startSegment('closing');
    else if (item.clip.mirroredMotion && phaseRef.current === 'opening' && !next) startSegment('closing');
    else if (item.clip.mirroredMotion && phaseRef.current === 'closing' && next) startSegment('opening');
    else if (['opening', 'closing'].includes(phaseRef.current) && manuallyPaused.current) {
      manuallyPaused.current = false;
      videoAt(activeSlot.current)?.play().catch(() => {});
    }
  };

  const closeInformation = () => {
    const origin = document.activeElement;
    requestState(false);
    const currentChapter = chapterRef.current;
    requestAnimationFrame(() => {
      if (currentChapter === chapterRef.current && !informationRef.current && (document.activeElement === origin || document.activeElement === document.body)) restoreFocus();
    });
  };

  const retryPlayback = () => {
    const index = chapterRef.current - 1;
    const slot = deckRef.current.indexOf(index);
    if (slot < 0) return;
    sequence.current += 1;
    errorsRef.current.delete(index);
    setErrors(new Set(errorsRef.current));
    setRequested(previous => new Set(previous).add(index));
    desiredOpen.current = true;
    if (kitchenProducts[index]?.clip.status === 'ready' && kitchenProducts[index].clip.cabinetDrawer) { cabinetTargetRef.current = 2; setCabinetTarget(2); }
    showInformation(true);
    manuallyPaused.current = false;
    activeSlot.current = slot;
    pendingSegment.current = 'opening';
    changePhase('opening');
    videoAt(slot)?.load();
    requestAnimationFrame(() => { if (chapterRef.current - 1 === index) restoreFocus(); });
  };

  syncOpticalTarget.current = target => {
    opticalTarget.current = target;
    if (target && (target.mode !== 'detail' || target.index !== chapterRef.current - 1)) {
      if (phaseRef.current !== 'closed' || informationRef.current) resetInteraction();
    }
    if (!target && phaseRef.current !== 'closed') resetInteraction();
    if (!target) {
      videoA.current?.pause(); videoB.current?.pause();
      stage.current?.style.setProperty('--kitchen-film-focus', '0');
      setShownSlot(null);
      return;
    }
    const item = kitchenProducts[target.index];
    if (!item || !isKitchenClipReady(item.clip) || errorsRef.current.has(target.index)) { setShownSlot(null); return; }
    if (target.mode === 'detail' && target.index === chapterRef.current - 1 && phaseRef.current !== 'closed') return;
    const slot = deckRef.current.indexOf(target.index);
    if (slot < 0) return;
    const node = videoAt(slot);
    if (!node || node.getAttribute('src') !== item.clip.video || node.readyState < 1) return;
    activeSlot.current = slot;
    node.pause();
    if (node.seeking) return;
    const wideBoundary = target.time === item.clip.wideFrame || target.time === item.clip.exit.end;
    // Seek inside the exact boundary frame, rather than retaining its neighbour
    // because it happens to be less than the normal scrub tolerance away.
    const seekTime = target.time + (wideBoundary ? .0001 : 0);
    if (Math.abs(node.currentTime - seekTime) > (wideBoundary ? .0005 : 1 / 30)) node.currentTime = seekTime;
    else if (node.readyState >= 2) {
      presentedTimes.current[slot] = node.currentTime;
      frameVideo(slot, { ...target, time: node.currentTime });
      setShownSlot(slot);
    }
  };

  const finishSeek = (slot: number) => {
    const target = opticalTarget.current;
    const node = videoAt(slot);
    if (!node || !target || deckRef.current[slot] !== target.index) return;
    if (target.mode === 'detail' && phaseRef.current !== 'closed') return;
    if (node.readyState >= 2 && !node.seeking) {
      presentedTimes.current[slot] = node.currentTime;
      frameVideo(slot, { ...target, time: node.currentTime });
      setShownSlot(slot);
    }
    syncOpticalTarget.current(target);
  };

  useEffect(() => {
    if (shownSlot === null) return;
    const node = videoAt(shownSlot), canvas = ambience.current, surface = stage.current;
    if (!node || !canvas || !surface) return;
    const context = canvas.getContext('2d', { alpha: false });
    const item = shownProduct === null ? undefined : kitchenProducts[shownProduct];
    if (!item || !isKitchenClipReady(item.clip)) return;
    const clip = item.clip;
    const source = new URL(clip.video, document.baseURI).href;
    const frame = item?.id === 'aventos' ? aventosFrame.current : null;
    const frameContext = frame?.getContext('2d', { alpha: false });
    if (!context && !frameContext) return;
    const portrait = matchMedia('(max-width: 1024px) and (orientation: portrait)');
    let videoFrame: number | null = null, fallbackFrame = 0;
    const paint = () => {
      if (!environment.visible || !stageVisible || node.readyState < 2 || node.seeking || node.currentSrc !== source) return;
      // The native video layer can retain an old frame in the desktop preview.
      // Use the decoded frame itself so the raised front and controls agree.
      if (frame && frameContext) {
        if (frame.width !== node.videoWidth || frame.height !== node.videoHeight) {
          frame.width = node.videoWidth;
          frame.height = node.videoHeight;
        }
        frameContext.drawImage(node, 0, 0);
        if (!frame.hasAttribute('data-ready')) {
          frame.style.cssText = node.style.cssText;
          frame.setAttribute('data-ready', '');
        }
      }
      if (!context || !portrait.matches) return;
      const width = Math.min(360, Math.ceil(surface.clientWidth / 2));
      const height = Math.ceil(surface.clientHeight * width / surface.clientWidth);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const fit = Math.max(width / node.videoWidth, height / node.videoHeight);
      const w = node.videoWidth * fit, h = node.videoHeight * fit;
      const focusX = clip.detailHotspot.x;
      const x = clamp(width * .5 - w * focusX, width - w, 0);
      try { context.drawImage(node, x, (height - h) / 2, w, h); } catch { /* The next decoded frame retries a seek in progress. */ }
    };
    const cancel = () => {
      if (videoFrame !== null) node.cancelVideoFrameCallback(videoFrame);
      videoFrame = null;
      cancelAnimationFrame(fallbackFrame);
      fallbackFrame = 0;
    };
    const schedule = () => {
      if ((!portrait.matches && !frameContext) || !environment.visible || !stageVisible) return;
      if (typeof node.requestVideoFrameCallback === 'function') {
        if (videoFrame === null) videoFrame = node.requestVideoFrameCallback(() => { videoFrame = null; paint(); schedule(); });
      } else if (!node.paused && !fallbackFrame) {
        fallbackFrame = requestAnimationFrame(() => { fallbackFrame = 0; paint(); schedule(); });
      }
    };
    const refresh = () => { paint(); schedule(); };
    const change = () => { cancel(); refresh(); };
    const resize = new ResizeObserver(paint);
    resize.observe(surface);
    node.addEventListener('seeked', refresh);
    node.addEventListener('loadeddata', refresh);
    node.addEventListener('play', refresh);
    node.addEventListener('pause', paint);
    portrait.addEventListener('change', change);
    refresh();
    return () => {
      cancel(); resize.disconnect();
      frame?.removeAttribute('data-ready');
      node.removeEventListener('seeked', refresh);
      node.removeEventListener('loadeddata', refresh);
      node.removeEventListener('play', refresh);
      node.removeEventListener('pause', paint);
      portrait.removeEventListener('change', change);
    };
  }, [shownSlot, shownProduct, environment.visible, stageVisible]);

  useEffect(() => {
    if (!calloutActive || !panel.current || !stage.current) return;
    const observer = new ResizeObserver(() => drawCallout.current());
    observer.observe(panel.current);
    observer.observe(stage.current);
    drawCallout.current();
    syncCalloutProgress();
    return () => observer.disconnect();
  }, [calloutActive, chapter]);

  useEffect(() => {
    const surface = stage.current;
    if (!surface) return;
    const observer = new IntersectionObserver(([entry]) => setStageVisible(entry.isIntersecting && entry.intersectionRatio >= .15), { threshold: [0, .15] });
    const preload = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearShowroom(true);
      preload.disconnect();
    }, { rootMargin: '240px 0px' });
    observer.observe(surface);
    preload.observe(surface);
    return () => { observer.disconnect(); preload.disconnect(); };
  }, []);

  useEffect(() => {
    resetInteraction();
    setPlaying(false);
    const index = Math.max(0, chapter - 1);
    const existing = deckRef.current.indexOf(index);
    const slot = existing >= 0 ? existing : 1 - activeSlot.current;
    activeSlot.current = slot;
    const next: Deck = [...deckRef.current];
    next[slot] = index;
    assignDeck(next);
    // Chapter text may change while the same video is still travelling. Keep its
    // decoded frame visible, and retain the previous ready clip for reverse scroll.
    const preload = setTimeout(() => {
      const neighbor = [index + 1, index - 1].find(candidate => {
        const clip = kitchenProducts[candidate]?.clip;
        return clip && isKitchenClipReady(clip);
      });
      const prepared: Deck = [...deckRef.current];
      prepared[1 - slot] = neighbor ?? null;
      assignDeck(prepared);
    }, 360);
    const reconcile = requestAnimationFrame(() => syncOpticalTarget.current(opticalTarget.current));
    return () => { clearTimeout(preload); cancelAnimationFrame(reconcile); };
  }, [chapter]);

  useEffect(() => {
    const node = videoAt(activeSlot.current);
    if (!node) return;
    if (!environment.visible || !stageVisible || manuallyPaused.current || !['opening', 'closing'].includes(phaseRef.current)) node.pause();
    else if (!pendingSegment.current) node.play().catch(() => {});
  }, [environment.visible, stageVisible]);

  useEffect(() => { syncOpticalTarget.current(opticalTarget.current); }, [deck, environment.ready, environment.reduced, environment.saveData]);

  useEffect(() => {
    if (!playing || !['opening', 'closing'].includes(phase)) return;
    let raf = 0;
    const watchBoundary = () => {
      const node = videoAt(activeSlot.current);
      syncCalloutProgress();
      if (node && !node.seeking && segmentEnd.current !== null && node.currentTime >= segmentEnd.current - .012) completeSegment(activeSlot.current);
      if (['opening', 'closing'].includes(phaseRef.current)) raf = requestAnimationFrame(watchBoundary);
    };
    raf = requestAnimationFrame(watchBoundary);
    return () => cancelAnimationFrame(raf);
  }, [phase, playing]);

  useEffect(() => {
    const container = root.current;
    const surface = stage.current;
    const plane = camera.current;
    if (!container || !surface || !plane) return;
    const triggers = Array.from(container.querySelectorAll<HTMLElement>('[data-kitchen-chapter]'));
    let raf = 0;
    const draw = () => {
      raf = 0;
      const width = surface.clientWidth;
      const height = surface.clientHeight;
      const bounds = container.getBoundingClientRect();
      if (bounds.top >= height || bounds.bottom <= 0) {
        viewportPosition.current = null;
        return;
      }
      let scroll = -bounds.top;
      const previousViewport = viewportPosition.current;
      if (previousViewport?.within && previousViewport.height !== height) {
        const top = container.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + previousViewport.units * height, behavior: 'instant' });
        scroll = -container.getBoundingClientRect().top;
      }
      viewportPosition.current = { height, units: scroll / height, within: scroll >= 0 && scroll <= container.offsetHeight - height };
      const positions = triggers.map((trigger, index) => index === 0 ? 0 : trigger.offsetTop - height * .45);
      let left = 0;
      for (let index = 1; index < positions.length; index += 1) if (scroll >= positions[index]) left = index;
      const right = Math.min(left + 1, positions.length - 1);
      const interval = Math.max(1, positions[right] - positions[left]);
      const raw = right === left ? 1 : clamp((scroll - positions[left]) / interval);
      const amount = smooth(clamp((raw - .25) / .55));
      const exitProgress = smooth(clamp(amount / .41));
      const enterProgress = smooth(clamp((amount - .59) / .41));
      // Both clips meet on this exact frame. The brief, scroll-driven hold also
      // covers decoder latency when changing direction at the handoff.
      const bridge = !environment.reduced && left > 0 && right > left
        ? smooth(clamp((.09 - Math.abs(amount - .5)) / .06)) : 0;
      surface.style.setProperty('--kitchen-bridge', `${bridge}`);
      const active = amount >= .5 ? right : left;
      const stacked = portraitFilm(window.innerWidth, height) || (window.innerWidth <= 700 && height >= 500);
      const mode = stacked ? 'mobile' : 'desktop';
      const poses = [kitchenScene.camera[mode], ...kitchenProducts.map(item => {
        const pose = item.camera[mode];
        return stacked && height < 720 ? { ...pose, screenY: Math.min(pose.screenY, .3) } : pose;
      })];
      let from = poses[left], to = poses[right], blend = amount;
      if (kitchenProducts.some(item => isKitchenClipReady(item.clip)) && left > 0 && right > left) {
        from = amount < .5 ? poses[left] : poses[0];
        to = amount < .5 ? poses[0] : poses[right];
        blend = amount < .5 ? exitProgress : enterProgress;
      }
      if (environment.reduced) { from = poses[active]; to = from; blend = 0; }
      const pose = Object.fromEntries(Object.keys(from).map(key => [key, interpolate(from[key as keyof KitchenCamera], to[key as keyof KitchenCamera], blend)])) as KitchenCamera;
      const fit = Math.max(width / kitchenScene.width, height / kitchenScene.height);
      const imageWidth = kitchenScene.width * fit * pose.zoom;
      const imageHeight = kitchenScene.height * fit * pose.zoom;
      const x = clamp(width * pose.screenX - imageWidth * pose.focusX, width - imageWidth, 0);
      const desiredY = clamp(height * pose.screenY, Math.min(145, height * .46), Math.max(height - 150, height * .54));
      const y = clamp(desiredY - imageHeight * pose.focusY, height - imageHeight, 0);
      plane.style.width = `${imageWidth}px`;
      plane.style.height = `${imageHeight}px`;
      plane.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      let targetIndex = 0, targetMode: OpticalTarget['mode'] = 'wide', targetProgress = 0;
      if (environment.reduced) { targetIndex = Math.max(0, active - 1); targetMode = active === 0 ? 'wide' : 'detail'; }
      else if (left === 0) { targetIndex = 0; targetMode = amount === 0 ? 'wide' : amount === 1 ? 'detail' : 'intro'; targetProgress = amount; }
      else if (right === left || amount === 0) { targetIndex = left - 1; targetMode = 'detail'; }
      else if (amount < .5) { targetIndex = left - 1; targetMode = 'exit'; targetProgress = exitProgress; }
      else { targetIndex = right - 1; targetMode = amount === 1 ? 'detail' : 'intro'; targetProgress = enterProgress; }
      const targetClip = kitchenProducts[targetIndex]?.clip;
      let target: OpticalTarget | null = null;
      if (targetClip && isKitchenClipReady(targetClip) && !errorsRef.current.has(targetIndex)) {
        let time = targetMode === 'wide' ? targetClip.wideFrame : targetMode === 'detail' ? targetClip.opening.start : interpolate(targetClip[targetMode].start, targetClip[targetMode].end, targetProgress);
        if (targetMode === 'exit' && targetClip.exit.end - time < 1 / 24) time = targetClip.exit.end;
        if (targetMode === 'intro' && time - targetClip.intro.start < 1 / 24) time = targetClip.intro.start;
        target = { index: targetIndex, time, mode: targetMode };
      }
      const point = kitchenProducts[active - 1]?.hotspot;
      if (point) {
        let pointX = x + point.x * imageWidth;
        let pointY = y + point.y * imageHeight;
        let pointerX = pointX, pointerY = pointY;
        if (target && targetClip && isKitchenClipReady(targetClip) && shownSlot !== null && deckRef.current[shownSlot] === targetIndex) {
          const displayedTime = presentedTimes.current[shownSlot];
          const projection = frameVideo(shownSlot, { ...target, time: displayedTime });
          if (projection) { pointX = projection.x; pointY = projection.y; pointerX = projection.pointerX; pointerY = projection.pointerY; }
        }
        calloutPoint.current = { x: pointerX, y: pointerY };
        if (informationRef.current) drawCallout.current();
        surface.style.setProperty('--kitchen-hotspot-x', `${pointX.toFixed(2)}px`);
        surface.style.setProperty('--kitchen-hotspot-y', `${pointY.toFixed(2)}px`);
        const settled = environment.reduced || amount === 0 || amount === 1;
        const completeFilm = portraitFilm(window.innerWidth, height) && target && shownSlot !== null;
        const edge = completeFilm ? 30 : 58;
        const minY = completeFilm ? 108 : Math.min(135, height * .4);
        const inFrame = settled && (!target || target.mode === 'detail') && pointX > edge && pointX < width - edge && pointY > minY && pointY < Math.max(height - 140, height * .6);
        if (!inFrame && document.activeElement === hotspot.current) surface.focus({ preventScroll: true });
        if (inFrame !== hotspotVisibleRef.current) { hotspotVisibleRef.current = inFrame; setHotspotVisible(inFrame); }
      } else if (!hotspotVisibleRef.current) {
        hotspotVisibleRef.current = true;
        setHotspotVisible(true);
      }
      if (active !== chapterRef.current) {
        const moveFocus = panel.current?.contains(document.activeElement) || document.activeElement === hotspot.current || document.activeElement === drawerButton.current;
        chapterRef.current = active;
        setChapter(active);
        if (moveFocus) requestAnimationFrame(() => (active === 0 ? heroLink.current : hotspotVisibleRef.current ? hotspot.current : surface)?.focus({ preventScroll: true }));
      }
      if (heroNavigation.current && active > 0 && hotspotVisibleRef.current) {
        heroNavigation.current = false;
        requestAnimationFrame(restoreFocus);
      }
      syncOpticalTarget.current(target);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw();
    const resize = new ResizeObserver(schedule);
    resize.observe(surface);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(raf); resize.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [environment.reduced, shownSlot]);

  useEffect(() => {
    const nodes = [videoA.current, videoB.current];
    return () => { nodes.forEach(node => node?.pause()); };
  }, []);

  const heading = (product?.title ?? kitchenScene.title).split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>);
  const moving = phase === 'opening' || phase === 'closing';

  return <section ref={root} className="kitchen-experience" aria-label="Recorrido interactivo por una cocina">
    <div ref={stage} tabIndex={-1} data-kitchen-phase={phase} data-cabinet-step={stagedCabinet ? cabinetStep : undefined} data-cabinet-target={stagedCabinet ? cabinetTarget : undefined} className={`kitchen-stage chapter-${chapter} ${product?.id === 'servo-drive' ? 'has-servo-drive' : ''} ${product?.id === 'aventos' && ready ? 'has-aventos' : ''} ${ready && product.clip.status === 'ready' && product.clip.hotspotMotion ? 'has-front-motion' : ''} ${stagedCabinet ? 'has-cabinet-drawer' : ''} ${stagedCabinet && cabinetTarget > 0 ? 'has-cabinet-open' : ''} ${shownSlot !== null ? 'has-optical' : ''} ${informationOpen ? 'has-information' : ''} ${chapter > 0 && !hotspotVisible ? 'is-travelling' : ''}`} onKeyDown={event => { if (event.key === 'Escape' && stagedCabinet && cabinetTarget > 0) { event.preventDefault(); requestCabinetStep(cabinetTarget === 2 ? 1 : 0); } else if (event.key === 'Escape' && informationRef.current) { event.preventDefault(); closeInformation(); } }}>
      {product && <h1 className="sr-only">Hauskeepers. Un espacio. Más posibilidades.</h1>}
      <div ref={camera} className="kitchen-camera" aria-hidden="true">
        <img src={kitchenScene.image} alt="" width={kitchenScene.width} height={kitchenScene.height} fetchPriority="high" decoding="async" className="kitchen-reference" />
      </div>
      <canvas ref={ambience} className="kitchen-ambience" aria-hidden="true" />
      <div id="kitchen-optical-media" className="kitchen-optical" aria-hidden="true">
        {deck.map((index, slot) => {
          const item = index === null ? undefined : kitchenProducts[index];
          const clip = item?.clip;
          const valid = clip && isKitchenClipReady(clip);
          const mayLoad = valid && environment.ready && ((nearShowroom && !environment.reduced && !environment.saveData) || (index !== null && requested.has(index)));
          return <video key={slot} ref={slot === 0 ? videoA : videoB} className={`kitchen-video ${shownSlot === slot ? 'is-shown' : ''}`} muted playsInline preload={mayLoad ? 'metadata' : 'none'} src={mayLoad && clip?.status === 'ready' ? clip.video : undefined}
            onLoadedMetadata={() => {
              const loadedIndex = deckRef.current[slot];
              const loadedClip = loadedIndex === null ? undefined : kitchenProducts[loadedIndex]?.clip;
              const node = videoAt(slot);
              if (!node || !loadedClip || !isKitchenClipReady(loadedClip)) return;
              if (!Number.isFinite(node.duration) || loadedClip.exit.end > node.duration + .05 || node.videoWidth !== loadedClip.width || node.videoHeight !== loadedClip.height) { failPlayback(loadedIndex!); return; }
              if (slot === activeSlot.current && pendingSegment.current) startSegment(pendingSegment.current);
              else {
                node.pause();
                if (opticalTarget.current?.index === loadedIndex) syncOpticalTarget.current(opticalTarget.current);
                else node.currentTime = loadedClip.wideFrame;
              }
            }}
            onLoadedData={() => finishSeek(slot)} onSeeked={() => { finishSeek(slot); syncCalloutProgress(); }}
            onPlaying={() => { if (slot === activeSlot.current && ['opening', 'closing'].includes(phaseRef.current)) { setShownSlot(slot); setPlaying(true); } }}
            onPause={() => { if (slot === activeSlot.current) setPlaying(false); }}
            onTimeUpdate={() => { const node = videoAt(slot); if (slot === activeSlot.current && node && !node.seeking && segmentEnd.current !== null && node.currentTime >= segmentEnd.current - .012) completeSegment(slot); }}
            onEnded={() => { const node = videoAt(slot); if (node && segmentEnd.current !== null && node.currentTime >= segmentEnd.current - .012) completeSegment(slot); }} onError={() => { if (deckRef.current[slot] !== null) failPlayback(deckRef.current[slot]!); }} />;
        })}
        <canvas ref={aventosFrame} className="kitchen-aventos-frame" />
      </div>
      <img src={kitchenScene.image} alt="" width={kitchenScene.width} height={kitchenScene.height} decoding="async" className="kitchen-bridge" aria-hidden="true" />
      <div className="kitchen-shade" aria-hidden="true" />
      <div className="kitchen-heading" key={chapter}>
        {product ? <h2>{heading}</h2> : <h1>{heading}</h1>}
        <p>{product?.description ?? kitchenScene.description}</p>
      </div>
      {product ? <button ref={hotspot} type="button" className={`kitchen-hotspot ${stagedCabinet && !failed ? 'kitchen-cabinet-control' : ''} ${moving && playing ? 'is-moving' : ''}`} aria-expanded={stagedCabinet && !failed ? cabinetTarget > 0 : informationOpen} aria-controls={stagedCabinet ? 'kitchen-optical-media' : 'kitchen-product-detail'} aria-hidden={!hotspotVisible} tabIndex={hotspotVisible ? 0 : -1} onClick={() => stagedCabinet && !failed ? requestCabinetStep(cabinetTargetRef.current > 0 ? 0 : 1) : requestState(!informationRef.current)}>
        <span className="kitchen-hotspot-circle" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d={(stagedCabinet && !failed ? cabinetTarget > 0 : informationOpen) ? 'M5 12h14' : 'M12 5v14M5 12h14'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
        <span className="kitchen-hotspot-label">{stagedCabinet && !failed ? cabinetTarget > 0 ? 'Cerrar gabinete' : 'Abrir gabinete' : informationOpen ? ready && !failed ? 'Cerrar' : 'Cerrar detalles' : ready && !failed ? product.action : `Explora ${product.name}`}</span>
      </button> : <a ref={heroLink} href="#productos" className="kitchen-enter" aria-label="Acercarte al primer producto" onClick={() => { heroNavigation.current = true; }}><Arrow /></a>}
      {stagedCabinet && !failed && cabinetStep > 0 && cabinetTarget > 0 && <button ref={drawerButton} type="button" className={`kitchen-hotspot kitchen-drawer-control ${moving && playing ? 'is-moving' : ''}`} aria-expanded={cabinetTarget === 2} aria-controls="kitchen-optical-media kitchen-product-detail" aria-hidden={!hotspotVisible} tabIndex={hotspotVisible ? 0 : -1} onClick={() => requestCabinetStep(cabinetTargetRef.current === 2 ? 1 : 2)}>
        <span className="kitchen-hotspot-circle" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d={cabinetTarget === 2 ? 'M5 12h14' : 'M12 5v14M5 12h14'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
        <span className="kitchen-hotspot-label">{cabinetTarget === 2 ? 'Cerrar cajón' : 'Abrir cajón'}</span>
      </button>}

      {product && calloutActive && <>
      {product.clip.status === 'ready' && product.clip.callout && ready && !failed && <svg className="kitchen-connector" aria-hidden="true"><path ref={connector} pathLength={1} /></svg>}
      <div ref={panel} id="kitchen-product-detail" className={`kitchen-panel ${informationOpen ? '' : 'is-hidden'}`} aria-hidden={!informationOpen} inert={!informationOpen} role="region" aria-labelledby="kitchen-product-name">
        <button type="button" className="kitchen-panel-close" aria-label="Cerrar detalles" onClick={closeInformation}>×</button>
        <div className="kitchen-brand"><BrandMark brand={product.brand} /></div><h3 id="kitchen-product-name">{product.name}</h3><p className="kitchen-detail">{product.detail}</p>
        <div className="kitchen-actions"><WhatsApp section={product.anchor} solution={product.name} brand={product.brand} className="kitchen-button">Cotizar</WhatsApp>{solution ? <SolutionButton id={product.id} origin={product.anchor} className="kitchen-link">Explorar</SolutionButton> : <a href={product.source} target="_blank" rel="noopener noreferrer" className="kitchen-link">Explorar<Arrow diagonal /></a>}</div>
        {failed && <button type="button" className="kitchen-retry" onClick={retryPlayback}>Reintentar video <Arrow /></button>}
      </div></>}

      {product && moving && <button ref={playbackButton} type="button" className="kitchen-playback" disabled={Boolean(pendingSegment.current)} aria-label={pendingSegment.current ? 'Cargando movimiento' : playing ? 'Pausar movimiento' : 'Continuar movimiento'} onClick={() => {
        const node = videoAt(activeSlot.current);
        if (!node) return;
        manuallyPaused.current = !node.paused;
        if (node.paused) node.play().catch(() => {}); else node.pause();
      }}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{playing ? <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" /> : <path d="m8 5 11 7-11 7Z" fill="currentColor" />}</svg></button>}

      {chapter === kitchenProducts.length && !informationOpen && !(stagedCabinet && cabinetTarget > 0) && <div className="kitchen-contact"><WhatsApp section="visita" extra="Quisiera planear una visita al showroom." className="kitchen-button">Ven a sentirlo</WhatsApp><a className="kitchen-link" href={data.contact.maps} target="_blank" rel="noopener noreferrer">Cómo llegar<Arrow diagonal /></a></div>}
      <p className="sr-only" aria-live="polite">{product ? `${product.brand}. ${product.name}.${informationOpen ? ' Información disponible.' : ''}` : 'Explora el espacio al deslizar.'}</p>
    </div>
    <div className="kitchen-triggers" aria-hidden="true"><div className="cinema-hero kitchen-trigger" data-kitchen-chapter="0" />{kitchenProducts.map((item, index) => <div className="kitchen-trigger" data-kitchen-chapter={index + 1} id={item.anchor} key={item.id} />)}</div>
  </section>;
}
