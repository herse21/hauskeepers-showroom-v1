'use client';

import { useEffect, useRef, useState } from 'react';
import { Arrow, BrandMark, WhatsApp, useContent } from './experience';
import { kitchenProducts } from './kitchen-media';
import { heroDockProgress, observeKitchenScroll, scheduleKitchenFrame } from '../lib/kitchen-motion';

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const progress = (x: number, start: number, end: number) => smooth(clamp((x - start) / (end - start)));
const approachAtFirstChapter = .82;
const descriptions = [
  'Desliza para recorrer la cocina. Toca los controles para abrir cada mueble.',
  'Un toque al frente activa el expulsor. Las guías MOVENTO van debajo del cajón de madera.',
  'El frente se eleva en una sola pieza y deja a la vista los compases laterales.',
  'Abre la puerta y elige cualquiera de los cinco cajones interiores LEGRABOX.',
];
const closedDrawers = () => [false, false, false, false, false];

export function KitchenShowroom3D() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const wake = useRef<() => void>(() => {});
  const controls = useRef({ doors: [false, false, false], drawers: closedDrawers() });
  const hotspots = useRef<(HTMLButtonElement | null)[]>([]);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [openDoors, setOpenDoors] = useState(controls.current.doors);
  const [openDrawers, setOpenDrawers] = useState(controls.current.drawers);
  const [drawerAccess, setDrawerAccess] = useState(false);
  const data = useContent();
  const product = kitchenProducts[chapter - 1];
  const open = openDoors[chapter - 1] ?? false;

  useEffect(() => { wake.current(); }, [chapter, ready, drawerAccess]);

  useEffect(() => {
    const surface = stage.current, node = canvas.current;
    const sections = Array.from(track.current?.children ?? []) as HTMLElement[];
    if (!surface || !node || !sections.length) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const loading = new AbortController();
    let active = true, lastTime = 0;
    let viewer: Awaited<ReturnType<typeof import('../lib/blum-review-scene').mountKitchen>> | undefined;
    let revealed = false;
    let chapterIndex = 0;
    let accessible = false;
    const doors = [0, 0, 0];
    const drawers = [0, 0, 0, 0, 0];
    let stageHeight = 0;
    let stageWidth = 0;
    let trackEnd = 0;
    let layout: { top: number; height: number }[] = [];

    function draw(scrollY: number, now: number) {
      if (!layout.length || scrollY >= trackEnd) {
        lastTime = 0;
        return;
      }
      const current = layout.findLastIndex(section => section.top <= scrollY + 1);
      const index = Math.max(0, current);
      const bounds = layout[index];
      const length = index === sections.length - 1 ? bounds.height - stageHeight : bounds.height;
      const position = clamp((scrollY - bounds.top) / Math.max(1, length));
      const travel = index === 0 || motion.matches ? 1 : progress(position, 0, .35);
      const hero = layout[0];
      const dock = heroDockProgress(scrollY, hero.height, stageHeight);
      const afterDock = progress(scrollY - hero.top, Math.max(1, hero.height - stageHeight), hero.height);
      const firstApproach = motion.matches ? Number(index > 0) : index === 0
        ? .55 * dock + (approachAtFirstChapter - .55) * afterDock
        : approachAtFirstChapter + (1 - approachAtFirstChapter) * travel;
      if (chapterIndex !== index) {
        setChapter(index);
        chapterIndex = index;
      }
      const targets = controls.current;
      const dt = lastTime ? Math.min(.25, (now - lastTime) / 1000) : 1 / 60;
      const damp = (from: number, to: number) => motion.matches || Math.abs(to - from) < .003 ? to : from + (to - from) * (1 - Math.exp(-9 * dt));
      const drawerReady = targets.doors[2] && (motion.matches || doors[2] > .985);
      drawers.forEach((value, i) => { drawers[i] = damp(value, Number(drawerReady && targets.drawers[i])); });
      const holdPantry = !targets.doors[2] && drawers.some(value => value > 0);
      doors.forEach((value, i) => { doors[i] = damp(value, Number(targets.doors[i] || (i === 2 && holdPantry))); });
      const canUseDrawers = index === 3 && travel >= .995 && targets.doors[2] && doors[2] > .985;
      if (accessible !== canUseDrawers) {
        accessible = canUseDrawers;
        setDrawerAccess(accessible);
      }
      viewer?.render({ chapter: index, travel, firstApproach, doors, drawers });
      if (viewer && !revealed) {
        revealed = true;
        setReady(true);
      }
      const settled = String(travel >= .95);
      if (surface!.dataset.cameraSettled !== settled) surface!.dataset.cameraSettled = settled;
      if (viewer && index > 0 && travel >= .95) {
        viewer.projectControls(index).forEach(({ x, y }, i) => {
          const button = hotspots.current[i];
          if (!button) return;
          button.style.setProperty('--hotspot-x', `${Math.min(94, Math.max(6, x)) * stageWidth / 100}px`);
          button.style.setProperty('--hotspot-y', `${Math.min(84, Math.max(11, y)) * stageHeight / 100}px`);
        });
      }
      if (doors.some((value, i) => value !== Number(targets.doors[i])) || drawers.some((value, i) => value !== Number(targets.drawers[i]))) {
        lastTime = now;
        scheduleKitchenFrame();
      } else {
        lastTime = 0;
      }
    }

    function resize() {
      if (!surface) return;
      const scrollY = window.scrollY;
      layout = sections.map(section => {
        const { top, height } = section.getBoundingClientRect();
        return { top: top + scrollY, height };
      });
      const last = layout[layout.length - 1];
      trackEnd = last.top + last.height;
      stageHeight = surface.clientHeight;
      stageWidth = surface.clientWidth;
      viewer?.resize(stageWidth, stageHeight);
      scheduleKitchenFrame();
    }
    function fail() {
      loading.abort();
      viewer?.dispose();
      viewer = undefined;
      if (active) {
        setReady(false);
        setUnavailable(true);
      }
    }
    wake.current = scheduleKitchenFrame;
    const unsubscribe = observeKitchenScroll(draw);
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    sections.forEach(section => observer.observe(section));
    motion.addEventListener('change', scheduleKitchenFrame);
    node.addEventListener('webglcontextlost', fail);
    resize();

    import('../lib/blum-review-scene').then(async ({ mountKitchen }) => {
      if (loading.signal.aborted) return;
      const mounted = await mountKitchen(node, loading.signal);
      if (!mounted) return;
      if (loading.signal.aborted) { mounted.dispose(); return; }
      viewer = mounted;
      resize();
    }).catch(fail);

    return () => {
      active = false;
      loading.abort();
      unsubscribe();
      observer.disconnect();
      motion.removeEventListener('change', scheduleKitchenFrame);
      node.removeEventListener('webglcontextlost', fail);
      viewer?.dispose();
      wake.current = () => {};
    };
  }, []);

  function toggle() {
    const doors = controls.current.doors.map((value, i) => i === chapter - 1 ? !value : value);
    const drawers = chapter === 3 && !doors[2] ? closedDrawers() : controls.current.drawers;
    controls.current = { doors, drawers };
    setOpenDoors(doors);
    setOpenDrawers(drawers);
    wake.current();
  }

  function toggleDrawer(index: number) {
    if (!drawerAccess || !controls.current.doors[2]) return;
    const drawers = controls.current.drawers.map((value, i) => i === index ? !value : value);
    controls.current.drawers = drawers;
    setOpenDrawers(drawers);
    wake.current();
  }

  return <section className="kitchen-experience kitchen-three" aria-label="Recorrido interactivo por una cocina">
    <div className={`kitchen-stage chapter-${chapter}`} ref={stage} data-three-ready={ready} data-three-chapter={chapter}>
      {!ready && <picture className="kitchen-three-preview" aria-hidden="true">
        <source media="(max-aspect-ratio: 19/20)" srcSet="/assets/kitchen-preview-tall.webp" />
        <img src="/assets/kitchen-preview-wide.webp" alt="" width={1920} height={880} fetchPriority="high" />
      </picture>}
      <canvas className="kitchen-three-canvas" ref={canvas} aria-hidden="true" />
      {unavailable && <p className="kitchen-three-status" role="status">La vista interactiva no está disponible en este navegador.</p>}
      <div className="kitchen-shade" aria-hidden="true" />
      {ready && chapter > 0 && <div className="kitchen-three-hotspots" key={chapter}>
        <button ref={node => { hotspots.current[0] = node; }} type="button" aria-pressed={open} onClick={toggle}
          className="kitchen-three-hotspot" aria-label={`${open ? 'Cerrar' : 'Abrir'} ${chapter === 1 ? 'cajón de la isla' : chapter === 2 ? 'frente AVENTOS' : 'puerta de la despensa'}`}>
          <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
        {chapter === 3 && drawerAccess && open && openDrawers.map((isOpen, index) =>
          <button key={index} ref={node => { hotspots.current[index + 1] = node; }} type="button" aria-pressed={isOpen}
            onClick={() => toggleDrawer(index)} className="kitchen-three-hotspot"
            aria-label={`${isOpen ? 'Cerrar' : 'Abrir'} cajón ${5 - index}`}>
            <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
          </button>
        )}
      </div>}
      <h1 className="sr-only">Hauskeepers. Un espacio. Más posibilidades.</h1>
      {chapter === 0 ? <>
        <div className="kitchen-heading"><p>{descriptions[0]}</p></div>
        <a href="#productos" className="kitchen-enter" aria-label="Acercarte al primer producto"><Arrow /></a>
      </> : <div className="kitchen-three-detail" key={product.id}>
        <div className="kitchen-three-brand"><BrandMark brand="Blum" /></div>
        <h2>{product.name}</h2>
        <p>{descriptions[chapter]}</p>
        <div className="kitchen-three-actions">
          {ready && <button type="button" className="kitchen-link" aria-pressed={open} onClick={toggle}>
            {open ? 'Cerrar' : 'Abrir'} {chapter === 1 ? 'cajón' : chapter === 2 ? 'frente' : 'puerta'}
          </button>}
          <WhatsApp section={product.anchor} solution={product.name} brand="Blum" className="kitchen-button">Cotizar</WhatsApp>
          <a href={product.source} target="_blank" rel="noopener noreferrer" className="kitchen-three-source" aria-label={`Ficha oficial de ${product.name}`}><Arrow diagonal /></a>
        </div>
        {chapter === 3 && drawerAccess && open && <div className="kitchen-three-drawers" role="group" aria-label="Cajones interiores, de arriba a abajo">
          {[4, 3, 2, 1, 0].map(index => <button key={index} type="button" aria-pressed={openDrawers[index]} onClick={() => toggleDrawer(index)}
            aria-label={`${openDrawers[index] ? 'Cerrar' : 'Abrir'} cajón ${5 - index} desde la lista`}>{5 - index}</button>)}
        </div>}
      </div>}
      <nav className="kitchen-three-nav" aria-label="Herrajes del recorrido">
        {kitchenProducts.map((item, i) => <a href={`#${item.anchor}`} key={item.id} aria-current={chapter === i + 1 ? 'location' : undefined}>{item.name}</a>)}
        {chapter === 3 && <a href={data.contact.maps} target="_blank" rel="noopener noreferrer">Cómo llegar <Arrow diagonal /></a>}
      </nav>
    </div>
    <div className="kitchen-triggers" ref={track} aria-hidden="true">
      <div className="cinema-hero kitchen-trigger" />
      {kitchenProducts.map(item => <div className="kitchen-trigger" id={item.anchor} key={item.id} />)}
    </div>
  </section>;
}
