'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BrandMark, Media, WhatsApp } from './experience';
import { BLUM_CONFIGURATOR } from '../lib/brand-resources';

const brands = [
  { name: 'Blum', tone: 'blum', title: 'El movimiento se siente.', text: 'Abrir. Cerrar. Descubrir nuevas posibilidades.', image: '/assets/merivobox-premium.webp', alt: 'Cajón MERIVOBOX de Blum en una cocina', href: BLUM_CONFIGURATOR, label: 'Configura con Blum' },
  { name: 'REHAU', tone: 'rehau', title: 'El diseño empieza en la superficie.', text: 'Texturas y acabados para imaginar tu espacio.', image: '/assets/grafite.webp', alt: 'Cocina con frentes brillantes en acabado grafito de REHAU', href: '', solution: 'conocer los acabados', label: 'Consulta por WhatsApp' },
  { name: 'Häfele', tone: 'hafele', title: 'El detalle hace la diferencia.', text: 'Conversemos sobre las soluciones para tu proyecto.', image: '/assets/hafele-loox-workspace.jpg', alt: 'Iluminación Häfele Loox integrada bajo un estante de madera', href: '', label: 'Explora las posibilidades' },
  { name: 'Stone Fusion', tone: 'stone', title: 'Materiales para sentir.', text: 'Encuentra el acabado que va con tu espacio.', image: '/assets/stone-surface-reference.jpg', alt: 'Fotografía de inspiración de una barra de piedra verde', href: '', label: 'Descubre los acabados' },
];
const limit = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value: number) => { const t = limit(value); return t * t * (3 - 2 * t); };

export function BrandJourney() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scenes = useRef<(HTMLElement | null)[]>([]);
  const controls = useRef<(HTMLButtonElement | null)[]>([]);
  const current = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = root.current;
    const viewport = stage.current;
    if (!container || !viewport) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previousPosition = -1;
    let previousReduced = reduced.matches;
    const draw = () => {
      frame = 0;
      const position = limit(-container.getBoundingClientRect().top / viewport.clientHeight - .2, 0, brands.length - 1);
      if (position === previousPosition && reduced.matches === previousReduced) return;
      previousPosition = position;
      previousReduced = reduced.matches;
      const next = Math.round(position);
      const base = Math.floor(position);
      const reveal = smooth((position - base - .38) / .24);
      scenes.current.forEach((scene, index) => {
        if (!scene) return;
        // Only the incoming photograph fades. A single shade covers both images.
        const opacity = reduced.matches ? Number(index === next) : index === base ? 1 : index === base + 1 ? reveal : 0;
        scene.style.setProperty('--brand-opacity', `${opacity}`);
      });
      if (next !== current.current) {
        if (scenes.current[current.current]?.contains(document.activeElement)) controls.current[next]?.focus({ preventScroll: true });
        current.current = next;
        setActive(next);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    draw();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); reduced.removeEventListener('change', schedule); };
  }, []);

  const go = (index: number) => {
    const container = root.current;
    if (!container || !stage.current) return;
    const height = stage.current.clientHeight;
    const top = container.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (index + .2) * height, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return <section ref={root} id="marcas" className="brand-journey" aria-label="El universo de marcas de Hauskeepers">
    <div ref={stage} className="brand-journey-stage">
      {brands.map((brand, index) => <article key={brand.name} ref={node => { scenes.current[index] = node; }} className={`brand-journey-scene tone-${brand.tone}`} style={{ '--brand-opacity': index === 0 ? 1 : 0 } as CSSProperties} aria-hidden={active !== index} inert={active !== index}>
        <Media src={brand.image} alt={brand.alt} className="brand-journey-image" />
        <div className="brand-journey-copy">
          <div className="brand-journey-name">{brand.name === 'Blum' ? <BrandMark brand="Blum" /> : brand.name}</div>
          <h2>{brand.title}</h2><p>{brand.text}</p>
          {brand.href ? <a className="brand-journey-action" href={brand.href} target="_blank" rel="noopener noreferrer">{brand.label}</a> : <WhatsApp section="marcas" brand={brand.name} solution={brand.solution} className="brand-journey-action">{brand.label}</WhatsApp>}
        </div>
      </article>)}
      <div className="brand-journey-shade" aria-hidden="true" />
      <nav className="brand-journey-nav" aria-label="Elegir una marca">{brands.map((brand, index) => <button ref={node => { controls.current[index] = node; }} type="button" key={brand.name} aria-label={`Ver ${brand.name}`} aria-pressed={active === index} onClick={() => go(index)} onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? brands.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + brands.length) % brands.length;
        controls.current[next]?.focus(); go(next);
      }}><span /></button>)}</nav>
      <p className="sr-only" aria-live="polite">{brands[active].name}</p>
    </div>
  </section>;
}
