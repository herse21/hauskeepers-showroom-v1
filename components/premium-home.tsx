'use client';

import { useEffect, useRef, useState } from 'react';
import { Arrow, Media, SolutionButton, WhatsApp, useContent } from './experience';
import { track } from '../lib/analytics';
import { BrandJourney } from './brand-journey';
import { BLUM_CONFIGURATOR } from '../lib/brand-resources';

export { BLUM_CONFIGURATOR } from '../lib/brand-resources';

const featured = [
  { id: 'servo-drive', title: 'Un toque.\nY se abre.', image: '/assets/kitchen-hardware-v4.webp', alt: 'Cajones sin tiradores para apertura eléctrica asistida SERVO-DRIVE', position: 'right', description: 'Un ligero toque en el frente y el cajón se abre con asistencia eléctrica.' },
  { id: 'aventos', title: 'Más espacio.\nMás libertad.', image: '/assets/lift.webp', alt: 'Frentes elevables AVENTOS de Blum', position: 'center', description: 'El frente se eleva y deja libre el acceso al mueble superior.' },
  { id: 'space-tower', title: 'Cada nivel,\na tu alcance.', image: '/assets/storage.webp', alt: 'Despensa SPACE TOWER con extraíbles interiores independientes', position: 'center', description: 'Organiza tu despensa con cajones independientes. Conoce LEGRABOX Noble Rust.' },
];

export function ProductGallery({ standalone = false }: { standalone?: boolean }) {
  const data = useContent();
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting && entry.intersectionRatio >= .6) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { root: node, threshold: .6 });
    node.querySelectorAll('[data-index]').forEach(slide => observer.observe(slide));
    return () => observer.disconnect();
  }, []);
  const go = (index: number) => {
    const node = rail.current;
    if (!node) return;
    const next = (index + featured.length) % featured.length;
    node.scrollTo({ left: next * node.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    track({ event: 'gallery_navigation', section: 'productos', direction: next > active ? 1 : -1 });
  };
  return <section id="productos" className={`product-gallery ${standalone ? 'standalone' : ''}`} aria-label="Productos destacados">
    <div className="gallery-heading" data-reveal><h2>El detalle hace<br />la diferencia<span>.</span></h2><p>Una selección para imaginar<br />lo que viene.</p></div>
    <div className="product-rail" ref={rail} role="region" aria-roledescription="carrusel" aria-label="Selección de productos" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); go(active + (e.key === 'ArrowRight' ? 1 : -1)); } }}>
      {featured.map((item, i) => {
        const solution = data.solutions.find(s => s.id === item.id);
        return <article className="product-scene" key={item.id} data-index={i} aria-label={`${i + 1} de ${featured.length}: ${solution?.name || item.id}`} aria-roledescription="diapositiva" inert={active !== i}>
          <Media src={item.image} alt={item.alt} className="product-picture" />
          <div className="product-shade" />
          <div className="product-copy"><p className="product-identity">{solution?.brand} · {solution?.name}</p><h3>{item.title.split('\n').map((line, n) => <span key={line}>{n > 0 && <br />}{line}</span>)}</h3><p className="product-description">{item.description}</p><div className="product-actions"><WhatsApp section="productos" solution={solution?.name} brand={solution?.brand} className="premium-button">Cotizar</WhatsApp><SolutionButton id={item.id} origin="productos" className="premium-link">Explorar</SolutionButton></div></div>
        </article>;
      })}
    </div>
    <div className="gallery-controls"><div className="gallery-dots" aria-label="Elegir producto">{featured.map((item, i) => <button key={item.id} aria-label={`Ver ${data.solutions.find(s => s.id === item.id)?.name || item.id}`} aria-pressed={active === i} onClick={() => go(i)}><span /></button>)}</div><p className="sr-only" aria-live="polite">Producto {active + 1} de {featured.length}</p><div className="gallery-arrows"><button aria-label="Producto anterior" onClick={() => go(active - 1)}>←</button><button aria-label="Siguiente producto" onClick={() => go(active + 1)}>→</button></div></div>
  </section>;
}

export function BrandStudio() {
  return <BrandJourney />;
}

export function VisitStudio({ standalone = false }: { standalone?: boolean }) {
  const data = useContent();
  return <section id="visita" className={`visit-studio ${standalone ? 'standalone' : ''}`}>
    <div className="visit-picture"><Media src="/assets/revego-premium.webp" alt="Detalle de un espacio con puertas pocket de Blum" /></div>
    <div className="visit-copy"><h2 data-reveal>Hay cosas<br />que tienes que abrir<br />para entender<span>.</span></h2><p>Ven a sentirlo.<br />Te esperamos en Mérida.</p><WhatsApp section="visita" extra="Quisiera planear una visita al showroom." className="premium-button">Planea tu visita</WhatsApp><div className="contact-block"><address>{data.contact.address}<br />Mérida, Yucatán · {data.contact.postalCode}</address><p>{data.contact.hours}</p><div className="contact-links"><a className="premium-link" href={data.contact.maps} target="_blank" rel="noopener noreferrer">Cómo llegar<Arrow diagonal /></a><a className="premium-link" href={`tel:+${data.contact.phone}`}>{data.contact.displayPhone}<Arrow diagonal /></a></div><WhatsApp section="agenda" extra="Me gustaría coordinar una videollamada de 15 minutos para revisar una cotización." className="premium-link">Coordina una videollamada</WhatsApp></div></div>
  </section>;
}

export function PremiumCollection({ type }: { type: 'soluciones' | 'inspiracion' | 'marcas' | 'profesionales' | 'showroom' }) {
  if (type === 'marcas') return <div className="premium-page"><h1 className="sr-only">Marcas y herramientas para tu proyecto</h1><BrandStudio /></div>;
  if (type === 'showroom') return <div className="premium-page"><h1 className="sr-only">Visita Hauskeepers en Mérida</h1><VisitStudio standalone /></div>;
  if (type === 'profesionales') return <div className="premium-page"><section className="pro-studio"><h1>Tu proyecto.<br />Cada detalle resuelto<span>.</span></h1><p>Herrajes, superficies y equipamiento.<br />Conversemos sobre lo que estás diseñando.</p><div><WhatsApp section="profesionales" className="premium-button">Revisemos tu proyecto</WhatsApp><a href={BLUM_CONFIGURATOR} className="premium-link" target="_blank" rel="noopener noreferrer">Configura con Blum<Arrow diagonal /></a></div></section><BrandStudio /><VisitStudio /></div>;
  return <div className="premium-page"><h1 className="sr-only">{type === 'inspiracion' ? 'Inspiración para tu espacio' : 'Soluciones para tu proyecto'}</h1><ProductGallery standalone /><VisitStudio /></div>;
}
