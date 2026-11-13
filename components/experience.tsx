'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { content as initial, type Content, type Solution } from '../lib/content';
import { track, whatsappUrl } from '../lib/analytics';
import { BLUM_CONFIGURATOR } from '../lib/brand-resources';
import { heroDockProgress, observeKitchenScroll, scheduleKitchenFrame } from '../lib/kitchen-motion';

const DataContext = createContext(initial);
const DetailContext = createContext<(id: string, origin?: string) => void>(() => {});
export const useContent = () => useContext(DataContext);
export const useDetails = () => useContext(DetailContext);

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M4 12h16m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Logo({ className = '' }: { className?: string }) {
  return <span className={`logo ${className}`} role="img" aria-label="Hauskeepers">
    <span className="logo-mark" aria-hidden="true"><svg viewBox="0 0 846 150" fill="currentColor">
      <path className="logo-stroke logo-stroke-one" d="M5 6H34V65.5L62 35V6H91V45L34 106V120H5Z" />
      <path className="logo-stroke logo-stroke-two" d="M48 106L113.5 35H156.5L77.5 120H48Z" />
      <path className="logo-stroke logo-stroke-three" d="M123 86L154 120H112.3L103 109.5Z" />
    </svg></span>
    <span className="logo-wordmark" aria-hidden="true" />
  </span>;
}
export function BrandMark({ brand }: { brand: string }) {
  return brand === 'Blum'
    ? <img className="hk-brand-mark" src="/assets/blum-logo.svg" width={100} height={50} alt="Blum" />
    : <span>{brand}</span>;
}
export function WhatsApp({ children = 'Habla con un especialista', section = 'general', solution, brand, className = 'button', extra }: { children?: ReactNode; section?: string; solution?: string; brand?: string; className?: string; extra?: string }) {
  const { contact } = useContent();
  return <a className={className} href={whatsappUrl(contact.phone, section, solution, brand, extra)} target="_blank" rel="noopener noreferrer" onClick={() => track({ event: 'whatsapp_click', section, solution, brand })}>{children}<Arrow diagonal /></a>;
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Content>(initial);
  const [selected, setSelected] = useState<{ id: string; origin: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  const previousFocus = useRef<HTMLElement | null>(null);
  const active = data.solutions.find(s => s.id === selected?.id);

  useEffect(() => {
    const controller = new AbortController();
    fetch(process.env.NEXT_PUBLIC_CONTENT_URL || '/content/showroom.json', { signal: controller.signal, cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(value => {
      if (value?.version === 1 && value.contact?.phone && value.hero?.image && Array.isArray(value.solutions) && value.solutions.length && Array.isArray(value.materials) && value.materials.length && Array.isArray(value.inspiration)) setData(value);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (selected && node && !node.open) {
      previousFocus.current = document.activeElement as HTMLElement;
      node.showModal();
      const overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = overflow; };
    }
    if (!selected && node?.open) node.close();
  }, [selected]);

  useEffect(() => { setSelected(null); track({ event: 'page_view' }); }, [path]);

  const open = (id: string, origin = 'soluciones') => {
    if (!data.solutions.some(s => s.id === id)) return;
    setSelected({ id, origin });
    const solution = data.solutions.find(s => s.id === id);
    track({ event: 'solution_open', solution: id, brand: solution?.brand, section: origin });
  };
  const close = () => {
    if (dialog.current?.open) dialog.current.close();
    setSelected(null);
    previousFocus.current?.focus();
  };

  return <DataContext.Provider value={data}><DetailContext.Provider value={open}>
    {children}
    <dialog className="solution-dialog hk-dialog" ref={dialog} aria-labelledby="solution-title" onCancel={event => { event.preventDefault(); close(); }} onClose={close} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      {active && <div className="dialog-layout">
        <button className="icon-button dialog-close" aria-label="Cerrar solución" onClick={close}>×</button>
        <div className="dialog-media"><Media src={active.image} alt={active.alt} eager /></div>
        <div className="dialog-copy">
          <div className="hk-dialog-brand"><BrandMark brand={active.brand} /></div>
          <h2 id="solution-title">{active.name}</h2>
          <p className="hk-dialog-description">{active.description}</p>
          <WhatsApp section={selected?.origin} solution={active.name} brand={active.brand}>Cotiza por WhatsApp</WhatsApp>
          <div className="hk-dialog-links">
            {active.brand === 'Blum' && <a href={BLUM_CONFIGURATOR} target="_blank" rel="noopener noreferrer">Configura con Blum <Arrow diagonal /></a>}
            <a href={active.source} target="_blank" rel="noopener noreferrer">Información del fabricante <Arrow diagonal /></a>
          </div>
        </div>
      </div>}
    </dialog>
  </DetailContext.Provider></DataContext.Provider>;
}

export function Header() {
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const home = path === '/';
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const logoAnchor = useRef<HTMLAnchorElement>(null);

  useEffect(() => { setMenu(false); }, [path]);

  useEffect(() => {
    const header = headerRef.current;
    const anchor = logoAnchor.current;
    if (!header || !anchor) return;
    if (!home) {
      header.classList.add('is-docked');
      return;
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hero = document.querySelector<HTMLElement>('.cinema-hero');
    const stage = document.querySelector<HTMLElement>('.kitchen-stage');
    let heroHeight = 0, stageHeight = 0;
    let deltaX = 0, deltaY = 0, targetScale = 1;
    let previousAmount = -1;
    const measure = () => {
      const target = anchor.getBoundingClientRect();
      const width = window.innerWidth;
      stageHeight = stage?.clientHeight ?? window.innerHeight;
      heroHeight = hero?.offsetHeight ?? 0;
      deltaX = target.left + target.width / 2 - width / 2;
      deltaY = target.top + target.height / 2 - stageHeight / 2;
      targetScale = target.width / Math.min(width * .74, 960, stageHeight * 1.08);
      previousAmount = -1;
      scheduleKitchenFrame();
    };
    const update = (scrollY: number) => {
      const progress = hero ? heroDockProgress(scrollY, heroHeight, stageHeight) : 1;
      const amount = reduced.matches ? Number(progress >= 1) : progress;
      if (amount === previousAmount) return;
      previousAmount = amount;
      header.classList.toggle('is-docked', amount >= .98);
      anchor.style.setProperty('--hk-logo-transform', `translate3d(${deltaX * amount}px, ${deltaY * amount}px, 0) scale(${1 + (targetScale - 1) * amount})`);
      anchor.style.setProperty('--hk-logo-halo', String(Math.max(.4, 1 - amount)));
    };
    const unsubscribe = observeKitchenScroll(update);
    measure();
    update(window.scrollY);
    window.addEventListener('resize', measure, { passive: true });
    reduced.addEventListener('change', scheduleKitchenFrame);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(anchor);
    if (hero) resizeObserver.observe(hero);
    if (stage) resizeObserver.observe(stage);
    return () => {
      unsubscribe();
      window.removeEventListener('resize', measure);
      reduced.removeEventListener('change', scheduleKitchenFrame);
      resizeObserver.disconnect();
    };
  }, [home, path]);

  useEffect(() => {
    if (!menu) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const background = Array.from(document.querySelectorAll<HTMLElement>('main, .hk-footer'));
    const previousInert = background.map(node => node.inert);
    background.forEach(node => { node.inert = true; });
    navRef.current?.querySelector<HTMLElement>('a')?.focus();
    const desktop = matchMedia('(min-width: 1051px)');
    const onDesktop = () => { if (desktop.matches) setMenu(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
        toggle.current?.focus();
      }
      if (event.key === 'Tab') {
        const items = [logoAnchor.current, toggle.current, ...Array.from(navRef.current?.querySelectorAll<HTMLElement>('a') || [])].filter(Boolean) as HTMLElement[];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    desktop.addEventListener('change', onDesktop);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      background.forEach((node, index) => { node.inert = previousInert[index]; });
      desktop.removeEventListener('change', onDesktop);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const items = [['/#productos', 'Productos'], ['/#marcas', 'Marcas'], ['/#configurador', 'Configurador'], ['/showroom', 'Visítanos']];
  return <header ref={headerRef} className={`hk-header ${home ? 'home' : 'is-docked'} ${path === '/marcas' ? 'brand-route' : ''} ${menu ? 'menu-open' : ''}`}>
    <Link ref={logoAnchor} href="/" aria-label="Hauskeepers · Inicio" className="hk-logo-anchor" onClick={event => {
      setMenu(false);
      if (home && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }}><Logo /></Link>
    <button ref={toggle} type="button" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} aria-controls="main-nav" aria-expanded={menu} className="hk-menu-toggle" onClick={() => setMenu(value => !value)}><span /><span /></button>
    <nav ref={navRef} id="main-nav" aria-label="Navegación principal" onClick={event => { if ((event.target as HTMLElement).closest('a')) setMenu(false); }}>
      {items.map(([id, title]) => home && id.startsWith('/#') ? <a href={id.slice(1)} key={id}>{title}</a>
        : <Link href={id} key={id}>{title}</Link>)}
      <WhatsApp className="hk-header-contact" section="menu">Hablemos</WhatsApp>
    </nav>
  </header>;
}

export function Footer() {
  const data = useContent();
  return <footer className="hk-footer">
    <span>© {new Date().getFullYear()} Hauskeepers</span>
    <div><a href={data.brand.instagram} target="_blank" rel="noopener noreferrer">Instagram <Arrow diagonal /></a><Link href="/privacidad">Privacidad</Link></div>
  </footer>;
}

export function MotionObserver() {
  const path = usePathname();
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
    }), { threshold: 0.12 });
    if (!reduced.matches) { document.documentElement.classList.add('motion-ready'); nodes.forEach(n => observer.observe(n)); }
    const depths = new Set<number>(); let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const available = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = available > 0 ? window.scrollY / available : 0;
        document.documentElement.style.setProperty('--page-progress', `${ratio * 100}%`);
        for (const depth of [25, 50, 75, 100]) if (ratio * 100 >= depth - 1 && !depths.has(depth)) { depths.add(depth); track({ event: 'scroll_depth', depth }); }
        raf = 0;
      });
    };
    const change = () => { if (reduced.matches) document.documentElement.classList.remove('motion-ready'); };
    reduced.addEventListener('change', change);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); reduced.removeEventListener('change', change); cancelAnimationFrame(raf); };
  }, [path]);
  return <div className="reading-progress" aria-hidden="true" />;
}

export function SolutionButton({ id, children = 'Conocer la solución', origin = 'home', className = 'text-link' }: { id: string; children?: ReactNode; origin?: string; className?: string }) {
  const open = useDetails();
  return <button className={className} onClick={() => open(id, origin)}>{children}<Arrow /></button>;
}

const imageDimensions: Record<string, readonly [number, number]> = {
  aventos: [1800, 1200], bar: [1167, 656], bianco: [1800, 1285], drawer: [1800, 1013],
  grafite: [1800, 1285], hero: [1920, 1080], kitchen: [1167, 656], lift: [1800, 1350],
  living: [1167, 656], material: [1800, 1285], moro: [1800, 1285], office: [1167, 656],
  revego: [1167, 656], 'revego-premium': [1920, 1080], 'merivobox-premium': [1170, 658], storage: [1800, 1350], wardrobe: [1167, 656], warm: [1800, 1285],
};

export function Media({ src, alt, className = '', eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const name = /^\/assets\/([^/]+)\.webp$/.exec(src)?.[1];
  const dimensions = name ? imageDimensions[name] : undefined;
  const small = dimensions ? src.replace('.webp', '-sm.webp') : undefined;
  return <img className={className} src={src} srcSet={small && dimensions ? `${small} 800w, ${src} ${dimensions[0]}w` : undefined} sizes="100vw" alt={alt} width={dimensions?.[0]} height={dimensions?.[1]} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" />;
}

export function Movement() {
  const data = useContent();
  const [selected, setSelected] = useState('merivobox');
  const solution = data.solutions.find(s => s.id === selected) || data.solutions[0];
  const tabs = [['merivobox', 'Deslizar'], ['aventos', 'Elevar'], ['servo-drive', 'Tocar']];
  const change = (id: string) => { setSelected(id); track({ event: 'movement_interaction', solution: id, section: 'movimiento', brand: 'Blum' }); };
  return <section className="movement section-pad" id="soluciones"><div className="section-heading" data-reveal><span className="eyebrow">01 / MOVIMIENTO</span><p>Diseñado para el día a día.</p></div><div className="movement-layout"><div className="movement-visual" data-reveal><Media src={solution.image} alt={solution.alt} /><span className="image-index">01—03</span>{'video' in solution && solution.video && <SolutionButton id={solution.id} origin="movimiento" className="play-button"><span aria-hidden="true">▷</span> Ver el movimiento</SolutionButton>}</div><div className="movement-copy" data-reveal><h2>Se ve bien.<br /><span className="muted">Se mueve mejor.</span></h2><div className="movement-tabs" role="tablist" aria-label="Tipos de movimiento">{tabs.map(([id, title], i) => <button role="tab" id={`tab-${id}`} aria-selected={selected === id} aria-controls="movement-panel" tabIndex={selected === id ? 0 : -1} key={id} onClick={() => change(id)} onKeyDown={e => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; change(tabs[next][0]); document.getElementById(`tab-${tabs[next][0]}`)?.focus(); } }}>{title}</button>)}</div><div id="movement-panel" role="tabpanel" aria-labelledby={`tab-${selected}`} tabIndex={0}><span className="product-brand">{solution.brand} <span>— {solution.name}</span></span><h3>{solution.title}</h3><p>{solution.description}</p><SolutionButton id={solution.id} origin="movimiento" /></div></div></div></section>;
}

export function PocketScene() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [amount, setAmount] = useState(0);
  const [manual, setManual] = useState(false);
  const manualRef = useRef(false);
  const lastTime = useRef(-1);
  const setFrame = (progress: number) => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration) || v.readyState < 1) return;
    const t = progress * Math.max(0, v.duration - 0.08);
    if (Math.abs(t - lastTime.current) > 0.05) { v.currentTime = t; lastTime.current = t; }
  };
  useEffect(() => {
    const el = ref.current; const v = video.current;
    if (!el || !v) return;
    let visible = false, raf = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      raf = 0;
      if (!visible || manualRef.current || reduced.matches || window.innerWidth < 760) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)));
      setAmount(progress); setFrame(progress);
    };
    const onScroll = () => { if (!raf && visible) raf = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { if (!v.getAttribute('src')) { v.src = '/assets/revego.mp4'; v.load(); } onScroll(); }
    }, { rootMargin: '200px' });
    observer.observe(el);
    v.addEventListener('loadeddata', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => { observer.disconnect(); v.removeEventListener('loadeddata', onScroll); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); v.pause(); };
  }, []);
  const scrub = (value: number) => {
    manualRef.current = true; setManual(true); setAmount(value); setFrame(value);
    track({ event: 'pocket_interaction', solution: 'revego', section: 'ocultamiento', progress: Math.round(value * 100) });
  };
  return <section className="pocket-scene" ref={ref} id="ocultamiento"><div className="pocket-sticky"><div className="pocket-heading"><span className="eyebrow">03 / OTRA FORMA DE HABITAR</span><h2>El espacio también<br />puede desaparecer<span className="orange">.</span></h2></div><div className="pocket-film"><video ref={video} muted playsInline preload="none" poster="/assets/pocket-poster.webp" aria-label="Demostración de apertura y ocultamiento del sistema REVEGO de Blum" /><div className="film-caption"><span>BLUM — REVEGO</span><span>{amount < .2 ? 'Un frente limpio.' : amount < .75 ? 'Una nueva posibilidad.' : 'Acceso liberado.'}</span></div></div><div className="pocket-bottom"><label className="scrubber"><span>Oculto</span><input type="range" min="0" max="100" value={Math.round(amount * 100)} aria-label="Explorar el movimiento REVEGO" onChange={e => scrub(Number(e.target.value) / 100)} /><span>En movimiento</span></label><SolutionButton id="revego" origin="ocultamiento">Explorar REVEGO</SolutionButton><p className="small-note">{manual ? 'Desliza para explorar el movimiento.' : 'Baja para descubrir. También puedes usar el control.'}</p></div></div></section>;
}

export function Materials() {
  const data = useContent();
  const [active, setActive] = useState(0);
  const material = data.materials[active] || data.materials[0];
  return <section className="materials section-pad" id="materiales"><div className="section-heading" data-reveal><span className="eyebrow">04 / MATERIALIDAD</span><p>Otra luz. Otra sensación.</p></div><div className="material-layout"><div className="material-copy" data-reveal><h2>El carácter<br />está en<br /> <span className="serif">la superficie.</span></h2><p>Lo que ves. Lo que tocas.<br />Lo que hace tuyo un espacio.</p><div className="swatches" aria-label="Explorar acabados REHAU">{data.materials.map((m, i) => <button key={m.id} aria-label={`Ver acabado ${m.name}`} aria-pressed={active === i} style={{ '--swatch': m.color } as React.CSSProperties} onClick={() => { setActive(i); track({ event: 'material_select', brand: 'REHAU', material: m.id, section: 'materiales' }); }}><span /></button>)}</div><div className="material-spec" aria-live="polite"><strong>{material.name}</strong><span>{material.finish}</span></div><SolutionButton id="rauvisio" origin="materiales">Encuentra tu acabado</SolutionButton></div><figure className="material-visual" data-reveal><Media src={material.image} alt={material.alt} /><figcaption>REHAU / {material.name}<span>Fotografía de inspiración</span></figcaption></figure></div><div className="stone-line"><p>¿Piensas en piedra para tu proyecto?</p><WhatsApp section="materiales" solution="Stone Fusion" brand="Stone Fusion" className="text-link">Consulta las opciones de Stone Fusion</WhatsApp></div></section>;
}

export function Inspiration({ full = false }: { full?: boolean }) {
  const data = useContent();
  const [active, setActive] = useState('cocina');
  const open = useDetails();
  const visible = full ? data.inspiration : data.inspiration.slice(0, 4);
  const item = data.inspiration.find(i => i.id === active) || data.inspiration[0];
  return <section className={`inspiration section-pad ${full ? 'inspiration-full' : ''}`} id="inspiracion"><div className="section-heading" data-reveal><span className="eyebrow">INSPIRACIÓN / EMPIEZA POR TU ESPACIO</span>{!full && <Link className="text-link" href="/inspiracion">Ver todos los espacios <Arrow /></Link>}</div><div className="inspiration-layout"><div className="inspiration-menu"><h2>¿Qué quieres<br /><span className="serif">transformar?</span></h2>{visible.map((entry, i) => <button key={entry.id} className={entry.id === active ? 'active' : ''} onClick={() => { setActive(entry.id); track({ event: 'inspiration_select', section: entry.id }); }} aria-pressed={entry.id === active}><span className="list-index">0{i + 1}</span>{entry.title}<Arrow /></button>)}</div><div className="inspiration-preview"><Media src={item.image} alt={item.alt} /><div className="inspiration-caption"><h3>{item.subtitle}</h3><div className="inspiration-solutions">{item.solutions.slice(0, 3).map(id => { const s = data.solutions.find(s => s.id === id); return s && <button key={id} onClick={() => open(id, `inspiracion-${item.id}`)}>{s.name}<Arrow diagonal /></button>; })}</div></div></div></div></section>;
}

export function Brands({ full = false }: { full?: boolean }) {
  const open = useDetails();
  return <section className={`brands section-pad ${full ? 'brands-full' : ''}`} id="marcas"><div className="section-heading"><span className="eyebrow">BUENAS IDEAS. GRANDES ALIADOS.</span>{!full && <Link href="/marcas" className="text-link">Nuestro universo <Arrow /></Link>}</div><div className="brand-primary"><button onClick={() => open('merivobox', 'marcas')}><span className="blum-word">blum</span><span>Movimiento que cambia el mobiliario.</span><Arrow diagonal /></button><button onClick={() => open('rauvisio', 'marcas')}><span className="rehau-word">REHAU</span><span>Superficies con carácter propio.</span><Arrow diagonal /></button></div><div className="brand-secondary"><WhatsApp section="marcas" solution="Stone Fusion" brand="Stone Fusion" className="brand-link"><span className="stone-word">STONE FUSION</span><span>Materialidad</span></WhatsApp><WhatsApp section="marcas" solution="Häfele" brand="Häfele" className="brand-link"><span className="hafele-word">Häfele</span><span>Soluciones y detalles</span></WhatsApp></div>{full && <div className="brand-context"><h2>Hauskeepers.<br />El punto de encuentro.</h2><p>Explora materiales, movimiento y equipamiento en un mismo lugar. Consulta con el equipo qué marcas, modelos y configuraciones encajan con tu proyecto.</p></div>}</section>;
}

export function Professionals({ full = false }: { full?: boolean }) {
  const [role, setRole] = useState('Arquitectura e interiorismo');
  return <section className={`professionals section-pad ${full ? 'professionals-full' : ''}`} id="profesionales"><div className="pro-copy" data-reveal><span className="eyebrow">PARA QUIENES CREAN ESPACIOS</span><h2>De la idea<br /><span className="serif">al detalle.</span></h2><p>Fabricas. Proyectas. Transformas.<br />Hablemos de lo que necesitas resolver.</p><WhatsApp section="profesionales" extra={`Me dedico a ${role.toLowerCase()}.`} className="button button-light">Conversemos sobre tu proyecto</WhatsApp></div><div className="pro-details" data-reveal><p>Un buen proyecto empieza<br />con las preguntas correctas.</p><div className="role-options" aria-label="Selecciona tu actividad">{['Arquitectura e interiorismo', 'Carpintería y fabricación', 'Desarrollo de proyectos'].map((r, i) => <button key={r} aria-pressed={role === r} onClick={() => { setRole(r); track({ event: 'professional_role', role: r, section: 'profesionales' }); }}><span>0{i + 1}</span>{r}<span className="role-check">{role === r ? '↗' : '+'}</span></button>)}</div>{full && <p className="pro-extra">Cuéntanos el tipo de espacio, sus medidas aproximadas y qué te gustaría lograr. El equipo te orientará sobre las soluciones y su disponibilidad.</p>}</div></section>;
}

export function Showroom({ full = false }: { full?: boolean }) {
  const data = useContent();
  return <section className={`showroom section-pad ${full ? 'showroom-full' : ''}`} id="showroom"><div className="showroom-left" data-reveal><span className="eyebrow">VEN A DESCUBRIRLO / MÉRIDA, YUCATÁN</span><h2>Hay cosas<br />que tienes<br />que <span className="serif">abrir.</span></h2><p>Ver, tocar y sentir el movimiento.<br />Conoce las posibilidades de tu próximo espacio.</p><WhatsApp section="showroom" className="button" extra="Quisiera planear mi visita al showroom.">Planea tu visita</WhatsApp></div><div className="showroom-info" data-reveal><div className="address-mark" aria-hidden="true"><span>20</span><span>MÉRIDA<br />YUCATÁN</span><Arrow diagonal /></div><address><span className="eyebrow">ENCUÉNTRANOS</span><p>{data.contact.address}<br />Mérida, Yucatán · C.P. {data.contact.postalCode}</p><p>{data.contact.hours}</p><a className="text-link" target="_blank" rel="noopener noreferrer" href={data.contact.maps} onClick={() => track({ event: 'directions_click', section: 'showroom' })}>Cómo llegar <Arrow diagonal /></a></address><div className="showroom-contact"><a href={`tel:+${data.contact.phone}`}>{data.contact.displayPhone}</a><a href={data.brand.instagram} target="_blank" rel="noopener noreferrer">@hauskeepers_hk <Arrow diagonal /></a></div></div></section>;
}

export function SolutionsIndex() {
  const data = useContent();
  const [filter, setFilter] = useState('Todas');
  const filters = ['Todas', ...new Set(data.solutions.map(s => s.category))];
  return <section className="solutions-index section-pad"><div className="filter-list" aria-label="Filtrar soluciones">{filters.map(f => <button aria-pressed={f === filter} key={f} onClick={() => { setFilter(f); track({ event: 'solutions_filter', filter: f, section: 'soluciones' }); }}>{f}</button>)}</div><div className="solution-rows">{data.solutions.filter(s => filter === 'Todas' || s.category === filter).map((s, i) => <article className="solution-row" key={s.id}><div className="solution-row-image"><Media src={s.image} alt={s.alt} /></div><div><span className="eyebrow">0{i + 1} / {s.brand} — {s.name}</span><h2>{s.title}</h2><p>{s.description}</p><SolutionButton id={s.id} origin="soluciones" /></div></article>)}</div></section>;
}
