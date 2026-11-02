'use client';
import Link from 'next/link';
import { Arrow, Brands, Inspiration, Materials, Media, Movement, PocketScene, Professionals, Showroom, SolutionButton, WhatsApp, useContent, useDetails } from './experience';

export function Home() {
  const data = useContent();
  const open = useDetails();
  return <>
    {data.promotion.enabled && <aside className="promotion"><SolutionButton id={data.promotion.solution} origin="promocion">{data.promotion.label}</SolutionButton></aside>}
    <section className="hero" aria-labelledby="home-title">
      <Media src={data.hero.image} alt={data.hero.alt} className="hero-image" eager />
      <div className="hero-shade" />
      <div className="hero-top"><span className="eyebrow">{data.hero.eyebrow}</span><span className="hero-edition">UN MUNDO DE POSIBILIDADES</span></div>
      <div className="hero-content"><span className="hero-overline"><span /> EL DISEÑO SE DESCUBRE</span><h1 id="home-title">{data.hero.line1}<br /><span>{data.hero.line2}</span></h1><div className="hero-bottom"><a className="hero-explore" href="#descubrir">Explora lo que no se ve<span><Arrow /></span></a><p>{data.hero.description}</p></div></div>
      <div className="hero-foot"><a href="#descubrir" aria-label="Bajar para descubrir"><span className="scroll-line" />DESLIZA PARA DESCUBRIR</a><span>{data.hero.credit}</span></div>
    </section>
    <div className="chapter-nav"><span>EL RECORRIDO</span><a href="#soluciones">01 Movimiento</a><a href="#almacenamiento">02 Almacenamiento</a><a href="#ocultamiento">03 Integración</a><a href="#materiales">04 Materialidad</a></div>
    <section className="manifesto section-pad" id="descubrir"><span className="eyebrow" data-reveal>HAUSKEEPERS / MÁS ALLÁ DEL HERRAJE</span><div className="manifesto-layout"><h2 data-reveal>Un espacio cambia<br />cuando descubres<br /><span className="muted">todo lo que puede ser.</span></h2><div data-reveal><span className="manifesto-mark" aria-hidden="true">↗</span><p>Movimiento. Almacenamiento. Materiales.<br />Las soluciones que dan otra dimensión<br />a tus ideas.</p><Link href="/soluciones" className="text-link">Descubre las posibilidades <Arrow /></Link></div></div></section>
    <Movement />
    <section className="storage" id="almacenamiento"><div className="storage-title section-pad" data-reveal><span className="eyebrow">02 / ALMACENAMIENTO</span><div><h2>Deja de buscar.<br /><span className="serif">Empieza a encontrar.</span></h2><p>No necesitas más fondo.<br />Necesitas llegar a lo que guardas.</p></div></div><div className="storage-image-wrap"><Media src="/assets/storage.webp" alt="Vista superior de SPACE TOWER: extraíbles interiores abiertos de forma independiente" /><button className="hotspot hotspot-1" aria-label="Descubrir los extraíbles interiores SPACE TOWER" onClick={() => open('space-tower', 'almacenamiento')}>+<span>Todo al alcance</span></button><button className="hotspot hotspot-2" aria-label="Consultar organización de la despensa" onClick={() => open('space-tower', 'almacenamiento')}>+<span>Cada nivel, independiente</span></button></div><div className="storage-bottom section-pad"><span className="product-brand">blum <span>— SPACE TOWER</span></span><p>Cada extraíble acerca el contenido a ti.</p><SolutionButton id="space-tower" origin="almacenamiento">Conocer SPACE TOWER</SolutionButton></div></section>
    <PocketScene />
    <Materials />
    <section className="integration section-pad"><div className="integration-copy" data-reveal><span className="eyebrow">05 / EQUIPAMIENTO INTEGRADO</span><h2>Todo encaja.<br /><span className="serif">Incluso tu estilo.</span></h2><p>La arquitectura y el equipamiento<br />hablan el mismo idioma.</p><span className="product-brand smeg-word">smeg</span><SolutionButton id="smeg" origin="equipamiento">Explora el equipamiento</SolutionButton></div><div className="integration-image" data-reveal><Media src="/assets/smeg.webp" alt="Horno SMEG Línea de diseño limpio, integrado en un ambiente de superficie clara" /><span className="image-credit">SMEG / ESTÉTICA LÍNEA</span></div></section>
    <section className="unexpected section-pad"><div data-reveal><span className="eyebrow">EL DETALLE TAMBIÉN CUENTA</span><h2>A veces, la diferencia<br />está en unos centímetros<span className="orange">.</span></h2></div><div className="unexpected-links" data-reveal>{[['Organizar mejor', 'organización y almacenamiento'], ['Dar otra luz', 'iluminación integrada'], ['Resolver un rincón', 'soluciones para espacios de difícil acceso']].map(([text, context], i) => <WhatsApp key={text} section="detalles" brand="Häfele" solution={context} className="unexpected-link"><span className="list-index">0{i + 1}</span>{text}</WhatsApp>)}<span className="small-note">Explora soluciones complementarias con Häfele.<br />La aplicación se revisa según tu proyecto.</span></div></section>
    <Inspiration />
    <Brands />
    <Professionals />
    <Showroom />
  </>;
}
