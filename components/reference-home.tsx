'use client';
import Link from 'next/link';
import { useEffect, useRef, type RefObject } from 'react';
import { Arrow, Media, SolutionButton, WhatsApp, useContent, useDetails } from './experience';
import { track } from '../lib/analytics';

function useScrollStage(ref: RefObject<HTMLElement | null>, update: (progress: number, node: HTMLElement) => void) {
  const callback = useRef(update);
  callback.current = update;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let visible = false, frame = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const draw = () => {
      frame = 0;
      if (!visible || reduced.matches) return;
      const rect = node.getBoundingClientRect();
      const header = innerWidth <= 800 ? 74 : 87;
      const distance = Math.max(1, rect.height - (innerHeight - header));
      const progress = Math.max(0, Math.min(1, (header - rect.top) / distance));
      callback.current(progress, node);
      node.style.setProperty('--stage-progress', progress.toFixed(3));
    };
    const schedule = () => { if (!frame && visible) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }, { rootMargin: '120px' });
    observer.observe(node);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, [ref]);
}

function Opening() {
  const data = useContent();
  const ref = useRef<HTMLElement>(null);
  useScrollStage(ref, (p, node) => {
    const initial = innerWidth <= 800 ? .78 : .36;
    const scale = initial + (1 - initial) * Math.min(1, p * 1.13);
    const height = innerHeight - (innerWidth <= 800 ? 74 : 87);
    node.style.setProperty('--opening-scale', scale.toFixed(4));
    node.style.setProperty('--opening-shift', `${(1 - scale) * (height / 2 - 26)}px`);
    node.style.setProperty('--opening-caption', `${Math.max(0, 1 - p * 3)}`);
  });
  return <section ref={ref} className="ref-opening" aria-labelledby="home-title"><div className="ref-opening-sticky"><div className="ref-opening-top"><span className="eyebrow">SHOWROOM DIGITAL · MÉRIDA</span><p>Más posibilidades.<br />Para cada espacio.</p></div><h1 id="home-title"><span className="sr-only">Hauskeepers. Hay más en tu espacio.</span></h1><p className="ref-opening-tagline">{data.hero.tagline}</p><div className="ref-opening-photo"><Media src={data.hero.image} alt={data.hero.alt} eager /><span className="ref-photo-credit">{data.hero.credit}</span></div><div className="ref-opening-bottom"><span>DISEÑO QUE SE DESCUBRE</span><a href="#posibilidades">Desliza para entrar <span>↓</span></a><span>01 / 03</span></div></div></section>;
}

function SelectedPossibilities() {
  const data = useContent();
  const open = useDetails();
  const ref = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  useScrollStage(ref, (p, node) => {
    if (innerWidth <= 800) return;
    node.style.setProperty('--fan-anchor', `${63 - p * 13}%`);
    const cards = node.querySelectorAll<HTMLElement>('.ref-fan-card');
    const spread = Math.min(260, (innerWidth - 360) / 4.6);
    cards.forEach((card, i) => {
      const position = i - (cards.length - 1) / 2;
      const x = position * (105 + p * (spread - 105));
      const y = position * (-45 + p * 31) + (1 - p) * 7;
      const rotate = position * (5 - p * 5);
      card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) rotate(${rotate}deg) rotateY(${-17 + p * 17}deg)`;
    });
  });
  const step = (direction: number) => {
    rail.current?.scrollBy({ left: direction * (innerWidth - 64), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    track({ event: 'gallery_navigation', section: 'posibilidades', direction });
  };
  return <section className="ref-selected" id="posibilidades" ref={ref}><div className="ref-selected-sticky"><div className="ref-selected-title"><h2>Posibilidades<br /><span className="serif">seleccionadas.</span><sup>05</sup></h2><span className="eyebrow">LO QUE NO IMAGINABAS<br />PARA TU ESPACIO</span></div><div className="ref-fan-stage" ref={rail} aria-label="Explorar cinco posibilidades para tu espacio">{data.selected.map((item, i) => <button key={item.id} className="ref-fan-card" style={{ zIndex: 10 - i }} onClick={() => open(item.id, 'galeria-home')} aria-label={`Explorar ${item.label}: ${item.title}`}><div className="ref-fan-inner"><Media src={item.image} alt={item.alt} /><span className="ref-fan-number">0{i + 1} / {item.label}</span><div className="ref-fan-caption"><h3>{item.title}</h3><span>Descubrir <Arrow diagonal /></span></div></div></button>)}</div><div className="ref-selected-bottom"><p>Cinco maneras de descubrir<br />algo más en tu espacio.</p><span className="ref-gallery-instruction">Explora una posibilidad <Arrow diagonal /></span><div className="ref-gallery-arrows"><button onClick={() => step(-1)} aria-label="Posibilidad anterior">←</button><button onClick={() => step(1)} aria-label="Siguiente posibilidad">→</button></div><Link href="/soluciones" className="text-link">Todas las soluciones <Arrow /></Link></div></div></section>;
}

function Visit() {
  const data = useContent();
  return <section className="ref-visit section-pad" id="showroom"><div className="ref-visit-copy" data-reveal><span className="eyebrow">EL SHOWROOM / MÉRIDA, YUCATÁN</span><h2>Hay cosas<br />que tienes que<br /><span className="serif">abrir para entender.</span></h2><p>Ver, tocar y sentir el movimiento.<br />Conoce las posibilidades de tu próximo proyecto.</p><WhatsApp section="showroom-home" extra="Quisiera planear mi visita al showroom." className="text-link">Planea tu visita</WhatsApp><div className="ref-visit-address"><p>{data.contact.address}<br />Mérida, Yucatán · {data.contact.postalCode}</p><p>{data.contact.hours}</p><a className="text-link" href={data.contact.maps} target="_blank" rel="noopener noreferrer" onClick={() => track({ event: 'directions_click', section: 'showroom-home' })}>Cómo llegar <Arrow diagonal /></a></div></div><div className="ref-visit-visual" data-reveal><Media src="/assets/lift.webp" alt="Diferentes movimientos de apertura de los frentes AVENTOS de Blum" /><span className="ref-visit-image-note">BLUM / AVENTOS<br />EXPLORA LOS MOVIMIENTOS</span><SolutionButton id="aventos" origin="showroom-home" className="ref-visit-discover">Abrir una posibilidad</SolutionButton></div></section>;
}

export function Home() {
  const data = useContent();
  return <div className="reference-home">{data.promotion.enabled && <aside className="promotion"><SolutionButton id={data.promotion.solution} origin="promocion">{data.promotion.label}</SolutionButton></aside>}<Opening /><SelectedPossibilities /><Visit /></div>;
}
